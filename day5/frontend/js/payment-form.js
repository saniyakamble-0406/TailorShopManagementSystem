
"use strict";

// ==========================================
// API URLS AND FORM ELEMENTS
// ==========================================

const API_BASE_URL = "http://127.0.0.1:8000/api";

const ORDERS_API_URL = `${API_BASE_URL}/orders/`;
const CUSTOMERS_API_URL = `${API_BASE_URL}/customers/`;
const PAYMENTS_API_URL = `${API_BASE_URL}/payments/`;

const paymentForm = document.querySelector(".customer-form");

const orderSelect = document.getElementById("order");
const amountInput = document.getElementById("amount");
const paymentMethodInput = document.getElementById("payment_method");
const paymentDateInput = document.getElementById("payment_date");
const notesInput = document.getElementById("notes");

const saveButton = paymentForm?.querySelector('button[type="submit"]');

let allOrders = [];
let allCustomers = [];
let allPayments = [];
let messageElement;
let balanceMessage;


// ==========================================
// DISPLAY FORM MESSAGES
// ==========================================

function showMessage(message, isError = true) {
    if (!messageElement) {
        messageElement = document.createElement("p");
        messageElement.setAttribute("role", "status");
        messageElement.setAttribute("aria-live", "polite");

        paymentForm?.prepend(messageElement);
    }

    messageElement.textContent = message;
    messageElement.style.color = isError ? "#B42318" : "#28754A";
}


// ==========================================
// API HELPERS
// ==========================================

function getList(data) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
}


async function apiRequest(url, options = {}) {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        throw new Error("Please log in before recording a payment.");
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            "Accept": "application/json",
            "Authorization": `Token ${token}`,
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("authUsername");
        sessionStorage.removeItem("authRole");

        throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
        const details = Object.entries(data)
            .map(([field, messages]) => {
                const message = Array.isArray(messages)
                    ? messages.join(" ")
                    : String(messages);

                return `${field}: ${message}`;
            })
            .join(" ");

        throw new Error(
            details || data.detail || `Request failed: HTTP ${response.status}`
        );
    }

    return data;
}


// ==========================================
// DATE AND AMOUNT HELPERS
// ==========================================

function formatMoney(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "Unavailable";

    return amount.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function getLocalDateTimeValue() {
    const now = new Date();
    const localDate = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
    );

    return localDate.toISOString().slice(0, 16);
}


// ==========================================
// CUSTOMER AND ORDER LOOKUPS
// ==========================================

function getCustomerName(customerId) {
    const customer = allCustomers.find(item =>
        Number(item.id) === Number(customerId)
    );

    return customer?.full_name || `Customer ${customerId}`;
}


function getOrderPayments(orderId) {
    return allPayments.filter(payment =>
        Number(payment.order) === Number(orderId)
    );
}


function getAmountPaid(orderId) {
    return getOrderPayments(orderId).reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
    );
}


function getOrderBalance(order) {
    const finalAmount = Number(order.final_amount);

    if (!Number.isFinite(finalAmount)) {
        return null;
    }

    return Math.max(0, finalAmount - getAmountPaid(order.id));
}


// ==========================================
// POPULATE ORDER DROPDOWN
// ==========================================

function populateOrders() {
    orderSelect.replaceChildren(
        new Option("Select Order", "")
    );

    allOrders.forEach(order => {
        const customerName = getCustomerName(order.customer);

        const option = new Option(
            `${order.order_number} — ${customerName}`,
            String(order.id)
        );

        orderSelect.add(option);
    });
}


// ==========================================
// DISPLAY REMAINING BALANCE
// ==========================================

function setupBalanceMessage() {
    if (!orderSelect) return;

    balanceMessage = document.createElement("p");
    balanceMessage.setAttribute("role", "status");
    balanceMessage.setAttribute("aria-live", "polite");
    balanceMessage.style.marginTop = "8px";
    balanceMessage.style.fontSize = "14px";
    balanceMessage.style.color = "#555555";

    orderSelect.parentElement?.appendChild(balanceMessage);
}


function updateOrderBalance() {
    const orderId = orderSelect.value;

    if (!balanceMessage) return;

    if (!orderId) {
        balanceMessage.textContent = "";
        return;
    }

    const order = allOrders.find(item =>
        Number(item.id) === Number(orderId)
    );

    if (!order) {
        balanceMessage.textContent = "Order not found.";
        return;
    }

    const balance = getOrderBalance(order);

    if (balance === null) {
        balanceMessage.textContent =
            "Order balance is unavailable.";
        return;
    }

    balanceMessage.textContent =
        `Order total: ${formatMoney(order.final_amount)} | ` +
        `Already paid: ${formatMoney(getAmountPaid(order.id))} | ` +
        `Balance: ${formatMoney(balance)}`;
}


// ==========================================
// LOAD DATA FROM BACKEND
// ==========================================

async function loadPaymentFormData() {
    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("authRole");

    if (!token) {
        showMessage("Please log in before recording a payment.");

        if (saveButton) saveButton.disabled = true;
        return;
    }

    if (!["admin", "staff"].includes(role)) {
        showMessage("Only authorised Admin or Staff accounts can record payments.");

        if (saveButton) saveButton.disabled = true;
        return;
    }

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Loading...";
    }

    try {
        const [ordersData, customersData, paymentsData] =
            await Promise.all([
                apiRequest(ORDERS_API_URL),
                apiRequest(CUSTOMERS_API_URL),
                apiRequest(PAYMENTS_API_URL)
            ]);

        allOrders = getList(ordersData);
        allCustomers = getList(customersData);
        allPayments = getList(paymentsData);

        populateOrders();
        setupBalanceMessage();

        // Support links that open the form for a specific order.
        const requestedOrder =
            new URLSearchParams(window.location.search).get("order");

        if (requestedOrder) {
            const matchingOrder = allOrders.find(order =>
                String(order.id) === requestedOrder
            );

            if (matchingOrder) {
                orderSelect.value = String(matchingOrder.id);
            }
        }

        orderSelect.addEventListener("change", updateOrderBalance);
        updateOrderBalance();

        // Default the date/time field to the user's current local time.
        if (paymentDateInput && !paymentDateInput.value) {
            paymentDateInput.value = getLocalDateTimeValue();
        }

        if (messageElement) {
            messageElement.remove();
            messageElement = null;
        }

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Save Payment";
        }

    } catch (error) {
        console.error("Payment form loading error:", error);

        showMessage(error.message || "Could not load payment form data.");

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = "Save Payment";
        }
    }
}


// ==========================================
// SAVE PAYMENT
// ==========================================

async function savePayment(event) {
    event.preventDefault();

    const role = sessionStorage.getItem("authRole");

    if (!["admin", "staff"].includes(role)) {
        showMessage("Only authorised Admin or Staff accounts can record payments.");
        return;
    }

    const orderId = orderSelect.value;
    const amount = Number(amountInput.value);
    const paymentMethod = paymentMethodInput.value;
    const paymentDateValue = paymentDateInput.value;

    if (!orderId) {
        showMessage("Please select an order.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        showMessage("Payment Amount must be greater than zero.");
        return;
    }

    if (!paymentMethod) {
        showMessage("Please select a payment method.");
        return;
    }

    if (!paymentDateValue) {
        showMessage("Please select the payment date and time.");
        return;
    }

    const selectedOrder = allOrders.find(order =>
        Number(order.id) === Number(orderId)
    );

    if (!selectedOrder) {
        showMessage("The selected order could not be found.");
        return;
    }

    const balance = getOrderBalance(selectedOrder);

    if (balance === null) {
        showMessage("Cannot verify the order balance. Please check the order.");
        return;
    }

    if (balance <= 0) {
        showMessage("This order has no outstanding balance.");
        return;
    }

    if (amount > balance + 0.001) {
        showMessage(
            `Payment exceeds the outstanding balance of ${formatMoney(balance)}.`
        );
        return;
    }

    // Convert the selected local date/time into an ISO datetime.
    const paymentDate = new Date(paymentDateValue);

    if (Number.isNaN(paymentDate.getTime())) {
        showMessage("Please enter a valid payment date and time.");
        return;
    }

    const payload = {
        order: Number(orderId),
        amount: amount.toFixed(2),
        payment_method: paymentMethod,
        payment_date: paymentDate.toISOString(),
        notes: notesInput.value.trim()
    };

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    try {
        await apiRequest(PAYMENTS_API_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        window.location.href =
            `payments.html?order=${encodeURIComponent(orderId)}`;

    } catch (error) {
        console.error("Payment save error:", error);

        showMessage(error.message || "Could not save the payment.");

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Save Payment";
        }
    }
}


// ==========================================
// INITIALISE FORM
// ==========================================

if (!paymentForm) {
    console.error("Payment form was not found.");
} else {
    paymentForm.addEventListener("submit", savePayment);
    loadPaymentFormData();
}

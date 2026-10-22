
"use strict";

// ==========================================
// API URLS AND HTML ELEMENTS
// ==========================================

const API_BASE_URL = "http://127.0.0.1:8000/api";

const PAYMENTS_API_URL = `${API_BASE_URL}/payments/`;
const ORDERS_API_URL = `${API_BASE_URL}/orders/`;
const CUSTOMERS_API_URL = `${API_BASE_URL}/customers/`;

const paymentTableBody = document.querySelector(".table-section tbody");
const paymentSearch = document.getElementById("payment-search");

let allPayments = [];
let allOrders = [];
let allCustomers = [];


// ==========================================
// SAFE HTML OUTPUT
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// ==========================================
// API RESPONSE HELPERS
// ==========================================

function getList(data) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
}


async function fetchAPI(url, token) {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Token ${token}`
        }
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("authUsername");
        sessionStorage.removeItem("authRole");

        throw new Error("Your login session has expired. Please log in again.");
    }

    if (!response.ok) {
        throw new Error(
            data.detail || `Request failed with HTTP ${response.status}.`
        );
    }

    return data;
}


// ==========================================
// TABLE MESSAGES
// ==========================================

function showTableMessage(message) {
    if (!paymentTableBody) return;

    paymentTableBody.innerHTML = `
        <tr>
            <td colspan="7">${escapeHTML(message)}</td>
        </tr>
    `;
}


// ==========================================
// FORMAT PAYMENT INFORMATION
// ==========================================

function formatMoney(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "—";

    return amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


function formatPaymentMethod(value) {
    const methods = {
        cash: "Cash",
        upi: "UPI",
        card: "Card",
        bank_transfer: "Bank Transfer"
    };

    return methods[value] || value || "—";
}


// ==========================================
// LOOK UP RELATED RECORDS
// ==========================================

function findOrder(orderId) {
    return allOrders.find(order =>
        Number(order.id) === Number(orderId)
    );
}


function getOrderNumber(orderId) {
    const order = findOrder(orderId);

    return order?.order_number || `Order ID: ${orderId}`;
}


function getCustomerName(orderId) {
    const order = findOrder(orderId);

    if (!order) return "—";

    const customer = allCustomers.find(item =>
        Number(item.id) === Number(order.customer)
    );

    return customer?.full_name || `Customer ID: ${order.customer}`;
}


// ==========================================
// DISPLAY PAYMENT RECORDS
// ==========================================

function renderPayments(payments) {
    if (!paymentTableBody) return;

    if (payments.length === 0) {
        showTableMessage("No payment records found.");
        return;
    }

    paymentTableBody.innerHTML = payments.map(payment => {
        const paymentCode =
            "PAY-" + String(payment.id).padStart(3, "0");

        return `
            <tr>
                <td>${escapeHTML(paymentCode)}</td>
                <td>${escapeHTML(getOrderNumber(payment.order))}</td>
                <td>${escapeHTML(getCustomerName(payment.order))}</td>
                <td>${escapeHTML(formatMoney(payment.amount))}</td>
                <td>${escapeHTML(formatPaymentMethod(payment.payment_method))}</td>
                <td>${escapeHTML(formatDate(payment.payment_date))}</td>
                <td>${escapeHTML(payment.notes || "—")}</td>
            </tr>
        `;
    }).join("");
}


// ==========================================
// SEARCH PAYMENTS
// ==========================================

function searchPayments() {
    const query = (paymentSearch?.value || "")
        .trim()
        .toLowerCase();

    const filteredPayments = allPayments.filter(payment => {
        const paymentCode =
            "PAY-" + String(payment.id).padStart(3, "0");

        const searchableValues = [
            payment.id,
            paymentCode,
            getOrderNumber(payment.order),
            getCustomerName(payment.order),
            payment.amount,
            payment.payment_method,
            payment.notes
        ];

        return searchableValues.some(value =>
            String(value ?? "").toLowerCase().includes(query)
        );
    });

    renderPayments(filteredPayments);
}


// ==========================================
// LOAD PAYMENT DATA
// ==========================================

async function loadPayments() {
    if (!paymentTableBody) {
        console.error("Payment table was not found.");
        return;
    }

    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("authRole");

    if (!token) {
        showTableMessage(
            "Please log in through the website to view payment records."
        );
        return;
    }

    if (!["admin", "staff", "customer"].includes(role)) {
        showTableMessage(
            "Your account does not have permission to view payments."
        );
        return;
    }

    showTableMessage("Loading payment records...");

    try {
        const [paymentsData, ordersData, customersData] =
            await Promise.all([
                fetchAPI(PAYMENTS_API_URL, token),
                fetchAPI(ORDERS_API_URL, token),
                fetchAPI(CUSTOMERS_API_URL, token)
            ]);

        allPayments = getList(paymentsData);
        allOrders = getList(ordersData);
        allCustomers = getList(customersData);

        // If opened from a specific Order Details page,
        // prefill Search with that order's number.
        const selectedOrderId =
            new URLSearchParams(window.location.search).get("order");

        if (selectedOrderId && paymentSearch) {
            const matchingOrder = findOrder(selectedOrderId);

            if (matchingOrder) {
                paymentSearch.value = matchingOrder.order_number || "";
            }
        }

        searchPayments();

    } catch (error) {
        console.error("Payment API error:", error);

        showTableMessage(
            error.message || "Could not load payment records. Check the backend and try again."
        );
    }
}


// ==========================================
// SEARCH EVENT
// ==========================================

if (paymentSearch) {
    paymentSearch.addEventListener("input", searchPayments);
}


// ==========================================
// INITIALISE PAGE
// ==========================================

loadPayments();

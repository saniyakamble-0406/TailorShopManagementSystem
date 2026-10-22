
"use strict";

// ==========================================
// API URLS AND PAGE ELEMENTS
// ==========================================

const API_BASE = "http://127.0.0.1:8000/api";

const ORDERS_API = `${API_BASE}/orders/`;
const CUSTOMERS_API = `${API_BASE}/customers/`;
const ITEMS_API = `${API_BASE}/order-items/`;
const SERVICES_API = `${API_BASE}/services/`;
const PAYMENTS_API = `${API_BASE}/payments/`;

const params = new URLSearchParams(window.location.search);
const orderId = params.get("id");

const clothingItemsBody =
    document.getElementById("clothing-items-body");

const workflowBody =
    document.getElementById("status-workflow-body");


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


async function fetchJSON(url, token) {
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
            data.detail || `Request failed with status ${response.status}.`
        );
    }

    return data;
}


// ==========================================
// DISPLAY HELPERS
// ==========================================

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent =
            value === null || value === undefined || value === ""
                ? "—"
                : String(value);
    }
}


function showMessage(message) {
    setText("page-message", message);
}


function formatStatus(value) {
    if (!value) return "—";

    return String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, character => character.toUpperCase());
}


function formatMoney(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "—";

    return amount.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function formatDate(value) {
    if (!value) return "—";

    const text = String(value);

    // Format date-only values without timezone conversion.
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
        const [, year, month, day] = match;

        const date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );

        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            });
        }
    }

    return text;
}


function formatDateTime(value) {
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


function getFabricSource(value) {
    const sources = {
        customer: "Customer Provided",
        shop: "Shop Provided"
    };

    return sources[value] || value || "—";
}


// ==========================================
// TABLE ROW HELPERS
// ==========================================

function appendCell(row, value, header = false) {
    const cell = document.createElement(header ? "th" : "td");

    if (header) {
        cell.scope = "row";
    }

    cell.textContent =
        value === null || value === undefined || value === ""
            ? "—"
            : String(value);

    row.appendChild(cell);
}


function showTableMessage(tableBody, columns, message) {
    tableBody.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = columns;
    cell.textContent = message;

    row.appendChild(cell);
    tableBody.appendChild(row);
}


// ==========================================
// WORKFLOW DISPLAY
// ==========================================

const workflowStages = [
    { value: "received", label: "1. Order Received" },
    { value: "measurement_confirmed", label: "2. Measurement Confirmed" },
    { value: "cutting", label: "3. Cutting" },
    { value: "stitching", label: "4. Stitching" },
    { value: "finishing", label: "5. Finishing" },
    { value: "ready", label: "6. Ready" },
    { value: "delivered", label: "7. Delivered" }
];


function renderWorkflow(currentStatus) {
    workflowBody.replaceChildren();

    const currentIndex = workflowStages.findIndex(
        stage => stage.value === currentStatus
    );

    workflowStages.forEach((stage, index) => {
        const row = document.createElement("tr");

        appendCell(row, stage.label);

        let result;

        if (currentIndex < 0) {
            result = "Not determined from current status";
        } else if (index < currentIndex) {
            result = "Completed (inferred)";
        } else if (index === currentIndex) {
            result = "Current";
        } else {
            result = "Pending (inferred)";
        }

        appendCell(row, result);

        workflowBody.appendChild(row);
    });

    if (currentIndex < 0) {
        const row = document.createElement("tr");

        appendCell(row, "Current order status");
        appendCell(row, formatStatus(currentStatus));

        workflowBody.appendChild(row);
    }
}


// ==========================================
// LOAD OPTIONAL LISTS
// ==========================================

async function loadOptionalList(url, token) {
    try {
        return getList(await fetchJSON(url, token));
    } catch (error) {
        console.warn(`Could not load optional data from ${url}:`, error);
        return null;
    }
}


// ==========================================
// LOAD ORDER DETAILS
// ==========================================

async function loadOrderDetails() {
    if (!orderId || !/^\d+$/.test(orderId)) {
        setText("order-heading", "Invalid Order ID");
        setText("customer-heading", "");
        showTableMessage(
            clothingItemsBody,
            5,
            "Open this page using the View link from Orders."
        );
        showTableMessage(
            workflowBody,
            2,
            "Order status cannot be loaded."
        );
        return;
    }

    const token = sessionStorage.getItem("authToken");

    if (!token) {
        setText("order-heading", "Login Required");
        setText("customer-heading", "");
        showTableMessage(clothingItemsBody, 5, "Please log in to view this order.");
        showTableMessage(workflowBody, 2, "Please log in to view order status.");
        return;
    }

    try {
        // Fetch the selected order first.
        const order = await fetchJSON(
            `${ORDERS_API}${encodeURIComponent(orderId)}/`,
            token
        );

        // Fetch related information. Payment data is optional.
        const [
            customers,
            items,
            services,
            payments
        ] = await Promise.all([
            loadOptionalList(CUSTOMERS_API, token),
            loadOptionalList(ITEMS_API, token),
            loadOptionalList(SERVICES_API, token),
            loadOptionalList(PAYMENTS_API, token)
        ]);

        const customerList = customers || [];
        const itemList = items || [];
        const serviceList = services || [];

        const selectedCustomer = customerList.find(
            customer => Number(customer.id) === Number(order.customer)
        );

        const customerName = selectedCustomer?.full_name
            || `Customer ID: ${order.customer}`;

        const customerOrderItems = itemList.filter(
            item => Number(item.order) === Number(order.id)
        );

        const serviceMap = new Map(
            serviceList.map(service => [
                Number(service.id),
                service.service_name
            ])
        );

        // Order heading and edit link.
        setText("order-heading", `Order Number: ${order.order_number}`);
        setText("customer-heading", `Customer: ${customerName}`);

        document.title =
            `${order.order_number} - Order Details`;

        const editLink = document.getElementById("edit-order-link");
        editLink.href =
            `order-form.html?id=${encodeURIComponent(order.id)}`;

        // Order Information.
        setText("detail-order-number", order.order_number);
        setText("detail-customer-name", customerName);
        setText("detail-fabric-source", getFabricSource(order.fabric_source));
        setText("detail-order-date", formatDateTime(order.created_at));
        setText("detail-delivery-date", formatDate(order.delivery_date));
        setText("detail-current-status", formatStatus(order.status));
        setText(
            "detail-instructions",
            order.special_instructions || "No special instructions."
        );

        // Clothing and Service Details.
        if (customerOrderItems.length === 0) {
            showTableMessage(
                clothingItemsBody,
                5,
                "No clothing items are registered for this order."
            );
        } else {
            clothingItemsBody.replaceChildren();

            customerOrderItems.forEach(item => {
                const row = document.createElement("tr");

                appendCell(row, item.clothing_type);
                appendCell(
                    row,
                    serviceMap.get(Number(item.service))
                        || `Service ID: ${item.service}`
                );
                appendCell(row, item.quantity);
                appendCell(row, formatMoney(item.unit_price));
                appendCell(row, formatMoney(item.subtotal));

                clothingItemsBody.appendChild(row);
            });
        }

        // Current workflow.
        renderWorkflow(order.status);

        // Payment Summary.
        const finalAmount = Number(order.final_amount);

        setText("payment-final-amount", formatMoney(finalAmount));

        if (payments === null) {
            setText("payment-amount-paid", "Unavailable");
            setText("payment-pending-amount", "Unavailable");
            setText(
                "payment-message",
                "Payment records could not be loaded, so the paid and pending amounts cannot be calculated."
            );
        } else {
            const orderPayments = payments.filter(
                payment => Number(payment.order) === Number(order.id)
            );

            const amountPaid = orderPayments.reduce(
                (total, payment) => total + Number(payment.amount || 0),
                0
            );

            const pendingAmount = Math.max(0, finalAmount - amountPaid);

            setText("payment-amount-paid", formatMoney(amountPaid));
            setText("payment-pending-amount", formatMoney(pendingAmount));

            if (orderPayments.length === 0) {
                setText(
                    "payment-message",
                    "No payment records are registered for this order."
                );
            } else {
                setText(
                    "payment-message",
                    `${orderPayments.length} payment record(s) found for this order.`
                );
            }
        }

        // Link to payment records for this order.
        document.getElementById("view-payments-link").href =
            `payments.html?order=${encodeURIComponent(order.id)}`;

    } catch (error) {
        console.error("Order details error:", error);

        setText("order-heading", "Could not load order details");
        setText("customer-heading", error.message);

        showTableMessage(
            clothingItemsBody,
            5,
            "Order clothing information could not be loaded."
        );

        showTableMessage(
            workflowBody,
            2,
            "Order workflow could not be loaded."
        );
    }
}


// ==========================================
// INITIALISE PAGE
// ==========================================

loadOrderDetails();

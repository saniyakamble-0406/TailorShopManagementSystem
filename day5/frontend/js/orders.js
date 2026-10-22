
"use strict";

// ==========================================
// API AND HTML ELEMENTS
// ==========================================

const ORDERS_API_URL = "http://127.0.0.1:8000/api/orders/";
const CUSTOMERS_API_URL = "http://127.0.0.1:8000/api/customers/";
const ORDER_ITEMS_API_URL = "http://127.0.0.1:8000/api/order-items/";

const orderTableBody = document.querySelector(".table-section tbody");
const orderSearch = document.getElementById("order-search");

let allOrders = [];
let allCustomers = [];
let allOrderItems = [];


// ==========================================
// SAFE TEXT OUTPUT
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
// TABLE MESSAGES
// ==========================================

function showTableMessage(message) {
    if (!orderTableBody) return;

    orderTableBody.innerHTML = `
        <tr>
            <td colspan="7">${escapeHTML(message)}</td>
        </tr>
    `;
}


// ==========================================
// DATE FORMATTING
// ==========================================

function formatDate(value) {
    if (!value) return "—";

    const parts = String(value).split("-");

    if (parts.length !== 3) return String(value);

    const [year, month, day] = parts;

    const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    );

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}


// ==========================================
// STATUS FORMATTING
// ==========================================

function formatStatus(status) {
    if (!status) return "—";

    return String(status)
        .replaceAll("_", " ")
        .replace(/\b\w/g, character => character.toUpperCase());
}


// ==========================================
// GET LIST FROM API RESPONSE
// ==========================================

function getList(data) {
    if (Array.isArray(data)) return data;

    if (data && Array.isArray(data.results)) {
        return data.results;
    }

    return [];
}


// ==========================================
// FIND CUSTOMER NAME
// ==========================================

function getCustomerName(customerId) {
    const customer = allCustomers.find(item =>
        Number(item.id) === Number(customerId)
    );

    return customer?.full_name || `Customer ID: ${customerId}`;
}


// ==========================================
// FIND CLOTHING TYPES FOR AN ORDER
// ==========================================

function getClothingTypes(orderId) {
    const types = allOrderItems
        .filter(item => Number(item.order) === Number(orderId))
        .map(item => item.clothing_type)
        .filter(Boolean);

    return [...new Set(types)].join(", ") || "—";
}


// ==========================================
// DISPLAY ORDERS
// ==========================================

function renderOrders(orders) {
    if (!orderTableBody) return;

    if (orders.length === 0) {
        showTableMessage("No orders found.");
        return;
    }

    orderTableBody.innerHTML = orders.map(order => {
        const orderId = encodeURIComponent(String(order.id));

        const customerName = getCustomerName(order.customer);
        const clothingType = getClothingTypes(order.id);

        const amount = Number(order.final_amount);
        const formattedAmount = Number.isFinite(amount)
            ? amount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
            : "—";

        return `
            <tr>
                <td>${escapeHTML(order.order_number)}</td>
                <td>${escapeHTML(customerName)}</td>
                <td>${escapeHTML(clothingType)}</td>
                <td>${escapeHTML(formattedAmount)}</td>
                <td>${escapeHTML(formatDate(order.delivery_date))}</td>
                <td>${escapeHTML(formatStatus(order.status))}</td>
                <td>
                    <a href="order-details.html?id=${orderId}">View</a>
                    <a href="order-form.html?id=${orderId}">Edit</a>
                </td>
            </tr>
        `;
    }).join("");
}


// ==========================================
// SEARCH ORDERS
// ==========================================

function searchOrders() {
    const query = (orderSearch?.value || "")
        .trim()
        .toLowerCase();

    const filteredOrders = allOrders.filter(order => {
        const customerName = getCustomerName(order.customer);
        const clothingType = getClothingTypes(order.id);

        const searchableValues = [
            order.order_number,
            customerName,
            clothingType,
            order.status,
            order.delivery_date
        ];

        return searchableValues.some(value =>
            String(value ?? "").toLowerCase().includes(query)
        );
    });

    renderOrders(filteredOrders);
}


// ==========================================
// FETCH AUTHENTICATED API DATA
// ==========================================

async function fetchAPI(url, token) {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Token ${token}`
        }
    });

    if (response.status === 401) {
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("authUsername");
        sessionStorage.removeItem("authRole");

        throw new Error(
            "Your session has expired. Please log in again."
        );
    }

    if (!response.ok) {
        throw new Error(`API request failed: HTTP ${response.status}`);
    }

    return response.json();
}


// ==========================================
// LOAD ORDERS, CUSTOMERS AND ORDER ITEMS
// ==========================================

async function loadOrders() {
    if (!orderTableBody) {
        console.error("Orders table was not found.");
        return;
    }

    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("authRole");

    if (!token) {
        showTableMessage(
            "Please log in through the website to view orders."
        );
        return;
    }

    if (!["admin", "staff", "customer"].includes(role)) {
        showTableMessage(
            "Your account does not have permission to view orders."
        );
        return;
    }

    showTableMessage("Loading orders...");

    try {
        const [ordersData, customersData, itemsData] = await Promise.all([
            fetchAPI(ORDERS_API_URL, token),
            fetchAPI(CUSTOMERS_API_URL, token),
            fetchAPI(ORDER_ITEMS_API_URL, token)
        ]);

        allOrders = getList(ordersData);
        allCustomers = getList(customersData);
        allOrderItems = getList(itemsData);

        searchOrders();

    } catch (error) {
        console.error("Orders API error:", error);

        showTableMessage(
            error.message || "Could not load orders. Check the backend and try again."
        );
    }
}


// ==========================================
// SEARCH EVENT
// ==========================================

if (orderSearch) {
    orderSearch.addEventListener("input", searchOrders);
}


// ==========================================
// INITIALISE PAGE
// ==========================================

loadOrders();

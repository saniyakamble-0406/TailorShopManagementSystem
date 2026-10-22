"use strict";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const params = new URLSearchParams(window.location.search);
const customerId = params.get("id");

const token = sessionStorage.getItem("authToken");

const customerName = document.getElementById("customer-name");
const customerIdLabel = document.getElementById("customer-id");
const customerMessage = document.getElementById("customer-message");

const orderBody = document.getElementById("order-history-body");
const orderMessage = document.getElementById("order-message");

const editLink = document.getElementById("edit-customer-link");


function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent =
            value === null || value === undefined || value === ""
                ? "—"
                : String(value);
    }
}


function showTableMessage(message) {
    orderBody.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 4;
    cell.textContent = message;

    row.appendChild(cell);
    orderBody.appendChild(row);
}


async function fetchJSON(url) {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Token ${token}`
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("authUsername");
            sessionStorage.removeItem("authRole");

            throw new Error("Your login session has expired. Please log in again.");
        }

        if (response.status === 403) {
            throw new Error("You do not have permission to view this information.");
        }

        throw new Error(
            data.detail || `Request failed with status ${response.status}.`
        );
    }

    return data;
}


function getList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && Array.isArray(data.results)) {
        return data.results;
    }

    return [];
}


function formatStatus(status) {
    if (!status) {
        return "—";
    }

    return String(status)
        .replaceAll("_", " ")
        .replace(/\b\w/g, character => character.toUpperCase());
}


function formatDate(value) {
    if (!value) {
        return "—";
    }

    const parts = String(value).split("-");

    if (parts.length !== 3) {
        return String(value);
    }

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


async function loadCustomer() {
    if (!customerId || !/^\d+$/.test(customerId)) {
        throw new Error("Invalid customer ID. Please open this page from Customers.");
    }

    const customer = await fetchJSON(
        `${API_BASE_URL}/customers/${encodeURIComponent(customerId)}/`
    );

    customerName.textContent = customer.full_name || "Customer Details";
    customerIdLabel.textContent = `Customer ID: ${customer.id}`;

    document.title =
        `${customer.full_name || "Customer"} - Customer Details`;

    setText("detail-full-name", customer.full_name);
    setText("detail-phone", customer.phone);
    setText("detail-email", customer.email);
    setText("detail-address", customer.address);
    setText("detail-notes", customer.notes);

    editLink.href =
        `customer-form.html?id=${encodeURIComponent(customer.id)}`;

    return customer;
}


async function loadOrderHistory() {
    showTableMessage("Loading order history...");

    try {
        const ordersData = await fetchJSON(`${API_BASE_URL}/orders/`);
        const orders = getList(ordersData);

        // Keep only orders belonging to this customer.
        const customerOrders = orders.filter(order =>
            Number(order.customer) === Number(customerId)
        );

        if (customerOrders.length === 0) {
            showTableMessage("No orders found for this customer.");
            return;
        }

        // Clothing type is stored in OrderItem.
        let items = [];

        try {
            const itemsData = await fetchJSON(
                `${API_BASE_URL}/order-items/`
            );

            items = getList(itemsData);
        } catch (error) {
            console.warn("Order item details could not be loaded:", error);
            orderMessage.textContent =
                "Some clothing details may be unavailable.";
        }

        orderBody.replaceChildren();

        customerOrders.forEach(order => {
            const row = document.createElement("tr");

            const orderItems = items.filter(item =>
                Number(item.order) === Number(order.id)
            );

            const clothingTypes = [...new Set(
                orderItems
                    .map(item => item.clothing_type)
                    .filter(Boolean)
            )];

            const values = [
                order.order_number,
                clothingTypes.length ? clothingTypes.join(", ") : "—",
                formatStatus(order.status),
                formatDate(order.delivery_date)
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "—";
                row.appendChild(cell);
            });

            orderBody.appendChild(row);
        });

    } catch (error) {
        console.error("Could not load order history:", error);
        showTableMessage(error.message || "Could not load order history.");
    }
}


async function initCustomerDetails() {
    if (!token) {
        customerName.textContent = "Login Required";
        customerIdLabel.textContent = "";
        customerMessage.textContent =
            "Please log in through the website to view customer details.";

        showTableMessage("Please log in to view order history.");
        return;
    }

    try {
        await loadCustomer();
        await loadOrderHistory();

    } catch (error) {
        console.error("Could not load customer details:", error);

        customerName.textContent = "Customer Details";
        customerIdLabel.textContent = "";
        customerMessage.textContent =
            error.message || "Could not load customer information.";

        showTableMessage("Order history is unavailable.");
    }
}


initCustomerDetails();
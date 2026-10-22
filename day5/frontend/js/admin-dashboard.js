
"use strict";

const API_BASE_URL = "http://127.0.0.1:8000/api/";

document.addEventListener("DOMContentLoaded", loadDashboard);

function getAuthToken() {
    return (
        sessionStorage.getItem("authToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token")
    );
}

async function fetchData(endpoint) {
    const token = getAuthToken();

    if (!token) {
        throw new Error("Login required. Please log in again.");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Token ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(
            `API request failed (${response.status}): ${endpoint}`
        );
    }

    const data = await response.json();

    return Array.isArray(data) ? data : (data.results || []);
}

function relationId(value) {
    if (value && typeof value === "object") {
        return value.id ?? value.pk ?? null;
    }

    return value ?? null;
}

function sameId(first, second) {
    const a = relationId(first);
    const b = relationId(second);

    return a != null && b != null && String(a) === String(b);
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function showMessage(message, isError = false) {
    const element = document.getElementById("dashboardMessage");

    if (element) {
        element.textContent = message;
        element.style.color = isError ? "#b42318" : "";
    }

    console[isError ? "error" : "log"](message);
}

async function loadDashboard() {
    showMessage("Loading dashboard data from the server...");

    try {
        const [customers, orders, payments, items, services] =
            await Promise.all([
                fetchData("customers/"),
                fetchData("orders/"),
                fetchData("payments/"),
                fetchData("order-items/"),
                fetchData("services/")
            ]);

        updateDashboardCounts(customers, orders, payments);
        displayRecentOrders(orders, customers, items, services);

        showMessage("Dashboard data loaded successfully.");
    } catch (error) {
        showMessage(
            `${error.message} Please check your login and server.`,
            true
        );

        const tbody = document.getElementById("recentOrdersBody");

        if (tbody) {
            tbody.innerHTML = "";

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.textContent = "Unable to load recent orders.";

            row.appendChild(cell);
            tbody.appendChild(row);
        }

        const message = document.getElementById("recentOrdersMessage");

        if (message) {
            message.textContent = "Could not load recent orders.";
        }
    }
}

function getOrderTotal(order) {
    const fields = [
        "final_amount",
        "final_total",
        "total_amount",
        "grand_total",
        "total"
    ];

    for (const field of fields) {
        if (order[field] !== undefined && order[field] !== null &&
            order[field] !== "") {
            const value = Number(order[field]);

            if (Number.isFinite(value)) {
                return Math.max(0, value);
            }
        }
    }

    return null;
}

function getPaymentAmount(payment) {
    const fields = ["amount", "payment_amount"];

    for (const field of fields) {
        if (payment[field] !== undefined && payment[field] !== null &&
            payment[field] !== "") {
            const value = Number(payment[field]);

            if (Number.isFinite(value)) {
                return Math.max(0, value);
            }
        }
    }

    return 0;
}

function updateDashboardCounts(customers, orders, payments) {
    const activeStatuses = [
        "pending",
        "confirmed",
        "in progress",
        "in_progress",
        "processing",
        "received",
        "measurement confirmed",
        "measurement_confirmed",
        "cutting",
        "stitching",
        "finishing"
    ];

    const readyStatuses = [
        "ready",
        "ready for collection",
        "ready_for_collection"
    ];

    const activeOrders = orders.filter(order => {
        const status = String(order.status || "")
            .toLowerCase()
            .trim();

        return activeStatuses.includes(status);
    });

    const readyOrders = orders.filter(order => {
        const status = String(order.status || "")
            .toLowerCase()
            .trim();

        return readyStatuses.includes(status);
    });

    const pendingPayments = orders.reduce((total, order) => {
        const orderTotal = getOrderTotal(order);

        const orderPayments = payments.filter(payment => {
            const paymentOrder =
                payment.order ?? payment.order_id;

            return sameId(paymentOrder, order.id);
        });

        const paid = orderPayments.reduce(
            (sum, payment) => sum + getPaymentAmount(payment),
            0
        );

        if (orderTotal !== null) {
            return total + Math.max(0, orderTotal - paid);
        }

        const explicitPending =
            order.pending_amount ??
            order.amount_due ??
            order.balance;

        if (explicitPending !== undefined &&
            explicitPending !== null &&
            explicitPending !== "") {
            const balance = Number(explicitPending);

            if (Number.isFinite(balance)) {
                return total + Math.max(0, balance);
            }
        }

        console.warn(
            "Order total unavailable; pending balance not included:",
            order.id
        );

        return total;
    }, 0);

    setText("totalCustomers", customers.length);
    setText("activeOrders", activeOrders.length);

    setText(
        "pendingPayments",
        `₹${pendingPayments.toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })}`
    );

    setText("readyOrders", readyOrders.length);
}

function displayRecentOrders(orders, customers, items, services) {
    const tbody = document.getElementById("recentOrdersBody");
    const message = document.getElementById("recentOrdersMessage");

    if (!tbody) {
        console.error("Element recentOrdersBody was not found.");
        return;
    }

    tbody.innerHTML = "";

    const recentOrders = [...orders]
        .sort((a, b) => {
            const dateA = new Date(
                a.created_at || a.order_date || a.id || 0
            ).getTime();

            const dateB = new Date(
                b.created_at || b.order_date || b.id || 0
            ).getTime();

            return dateB - dateA;
        })
        .slice(0, 5);

    if (recentOrders.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "No orders available.";

        row.appendChild(cell);
        tbody.appendChild(row);

        if (message) {
            message.textContent = "No recent orders found.";
        }

        return;
    }

    recentOrders.forEach(order => {
        const customerId = order.customer ?? order.customer_id;

        const customer = customers.find(item =>
            sameId(item.id, customerId)
        );

        const orderItems = items.filter(item => {
            const itemOrder = item.order ?? item.order_id;

            return sameId(itemOrder, order.id);
        });

        const clothingNames = orderItems.map(item => {
            const serviceId = item.service ?? item.service_id;

            const service = services.find(entry =>
                sameId(entry.id, serviceId)
            );

            return (
                item.clothing_type_display ||
                item.clothing_type ||
                item.garment_type ||
                item.item_type ||
                item.service_name ||
                service?.name ||
                service?.service_name ||
                item.name ||
                item.description ||
                ""
            );
        }).filter(Boolean);

        const clothing = [...new Set(clothingNames)].join(", ");

        const status = String(order.status || "—")
            .replaceAll("_", " ");

        const deliveryDate = order.delivery_date
            ? new Date(
                `${order.delivery_date}T00:00:00`
            ).toLocaleDateString("en-IN")
            : "—";

        const customerName =
            customer?.full_name ||
            customer?.name ||
            customer?.first_name ||
            order.customer_name ||
            (typeof order.customer === "object"
                ? order.customer.full_name ||
                  order.customer.name ||
                  ""
                : "") ||
            "—";

        const values = [
            order.order_number ||
                order.order_no ||
                `#${order.id}`,
            customerName,
            clothing || "—",
            status,
            deliveryDate
        ];

        const row = document.createElement("tr");

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = String(value);
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    if (message) {
        message.textContent =
            `Showing ${recentOrders.length} recent order(s).`;
    }
}

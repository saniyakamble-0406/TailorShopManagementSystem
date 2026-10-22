"use strict";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const customerTableBody = document.querySelector(".table-section tbody");
const customerSearch = document.getElementById("customer-search");
const customerSuggestions = document.getElementById("customer-suggestions");

let allCustomers = [];

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function showTableMessage(message) {
    if (!customerTableBody) return;

    customerTableBody.innerHTML = `
        <tr>
            <td colspan="6">${escapeHTML(message)}</td>
        </tr>
    `;
}

function updateCustomerSuggestions() {
    if (!customerSuggestions) return;

    customerSuggestions.replaceChildren();

    const seenNames = new Set();

    allCustomers.forEach(customer => {
        const name = String(customer.full_name ?? "").trim();

        if (!name || seenNames.has(name.toLowerCase())) return;

        seenNames.add(name.toLowerCase());

        const option = document.createElement("option");
        option.value = name;

        const details = [
            customer.phone,
            customer.email
        ].filter(Boolean).join(" | ");

        if (details) option.label = details;

        customerSuggestions.appendChild(option);
    });
}

function renderCustomers(customers) {
    if (!customerTableBody) return;

    if (customers.length === 0) {
        showTableMessage("No customer records found.");
        return;
    }

    customerTableBody.innerHTML = customers.map(customer => {
        const id = encodeURIComponent(String(customer.id));
        const name = escapeHTML(customer.full_name);
        const safeNameForAttribute = escapeHTML(customer.full_name);
        const phone = escapeHTML(customer.phone);
        const email = escapeHTML(customer.email || "—");
        const address = escapeHTML(customer.address || "—");

        return `
            <tr>
                <td>${escapeHTML(customer.id)}</td>
                <td>${name}</td>
                <td>${phone}</td>
                <td>${email}</td>
                <td>${address}</td>
                <td>
                    <a href="customer-details.html?id=${id}">View</a>
                    <a href="customer-form.html?id=${id}">Edit</a>
                    <button
                        type="button"
                        class="delete-customer-btn"
                        data-customer-id="${id}"
                        data-customer-name="${safeNameForAttribute}"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function searchCustomers() {
    const query = (customerSearch?.value || "").trim().toLowerCase();

    const filteredCustomers = allCustomers.filter(customer => {
        return [
            customer.full_name,
            customer.phone,
            customer.email,
            customer.address
        ].some(value =>
            String(value ?? "").toLowerCase().includes(query)
        );
    });

    renderCustomers(filteredCustomers);
}

async function loadCustomers() {
    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("authRole");

    if (!customerTableBody) return;

    if (!token) {
        showTableMessage(
            "Please log in through the website to view customer records."
        );
        return;
    }

    if (!["admin", "staff"].includes(role)) {
        showTableMessage(
            "Your account does not have permission to manage customers."
        );
        return;
    }

    showTableMessage("Loading customers...");

    try {
        const response = await fetch(`${API_BASE_URL}/customers/`, {
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

            showTableMessage(
                "Your session has expired. Please log in again."
            );
            return;
        }

        if (!response.ok) {
            throw new Error(`Request failed: HTTP ${response.status}`);
        }

        const data = await response.json();

        allCustomers = Array.isArray(data)
            ? data
            : Array.isArray(data.results)
                ? data.results
                : [];

        updateCustomerSuggestions();
        searchCustomers();

    } catch (error) {
        console.error("Could not load customers:", error);

        showTableMessage(
            "Could not load customers. Check the backend and refresh the page."
        );
    }
}

async function deleteCustomer(button) {
    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("authRole");

    const customerId = button.dataset.customerId;
    const customerName = button.dataset.customerName || "this customer";

    if (!token || !["admin", "staff"].includes(role)) {
        alert("Please log in with an authorised Admin or Staff account.");
        return;
    }

    const confirmed = window.confirm(
        `Delete "${customerName}"?\n\n` +
        "This action cannot be undone. Customers with orders or " +
        "measurement records are protected from deletion."
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = "Deleting...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/customers/${encodeURIComponent(customerId)}/`,
            {
                method: "DELETE",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Token ${token}`
                }
            }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("authUsername");
            sessionStorage.removeItem("authRole");

            throw new Error("Your session expired. Please log in again.");
        }

        if (response.status === 409) {
            throw new Error(
                data.detail ||
                "This customer has associated orders or measurements and cannot be deleted."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.detail || `Delete failed: HTTP ${response.status}`
            );
        }

        alert("Customer deleted successfully.");
        await loadCustomers();

    } catch (error) {
        alert(error.message || "Could not delete this customer.");
        button.disabled = false;
        button.textContent = "Delete";
    }
}

if (customerSearch) {
    customerSearch.addEventListener("input", searchCustomers);
}

if (customerTableBody) {
    customerTableBody.addEventListener("click", event => {
        const button = event.target.closest(".delete-customer-btn");

        if (button) {
            deleteCustomer(button);
        }
    });
}

loadCustomers();
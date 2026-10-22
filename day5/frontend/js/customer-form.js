
"use strict";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const customerForm = document.querySelector(".customer-form");
const params = new URLSearchParams(window.location.search);
const customerId = params.get("id");

const token = sessionStorage.getItem("authToken");
const role = sessionStorage.getItem("authRole");

const pageTitle = document.querySelector(".form-header h1");
const pageSubtitle = document.querySelector(".form-header p");
const sectionTitle = document.querySelector(".form-section h2");
const saveButton = customerForm?.querySelector(
    'button[type="submit"]'
);

let messageElement;

function showMessage(message, isError = true) {
    if (!messageElement) {
        messageElement = document.createElement("p");
        messageElement.setAttribute("role", "status");
        messageElement.setAttribute("aria-live", "polite");

        customerForm?.prepend(messageElement);
    }

    messageElement.textContent = message;
    messageElement.style.color = isError ? "#B42318" : "#28754A";
}

function getCustomerPayload() {
    return {
        full_name: document.getElementById("full_name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        address: document.getElementById("address").value.trim(),
        notes: document.getElementById("notes").value.trim()
    };
}

function setFormMode(isEditing) {
    if (pageTitle) {
        pageTitle.textContent = isEditing
            ? "Edit Customer"
            : "Add Customer";
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = isEditing
            ? "Update customer profile information"
            : "Create a new customer profile";
    }

    if (sectionTitle) {
        sectionTitle.textContent = isEditing
            ? "Edit Customer Information"
            : "Customer Information";
    }

    if (saveButton) {
        saveButton.textContent = isEditing
            ? "Update Customer"
            : "Save Customer";
    }

    document.title = isEditing
        ? "Edit Customer - Tailor Shop Management System"
        : "Add Customer - Tailor Shop Management System";
}

function fillCustomerForm(customer) {
    document.getElementById("full_name").value =
        customer.full_name || "";

    document.getElementById("phone").value =
        customer.phone || "";

    document.getElementById("email").value =
        customer.email || "";

    document.getElementById("address").value =
        customer.address || "";

    document.getElementById("notes").value =
        customer.notes || "";
}

async function readResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("authUsername");
            sessionStorage.removeItem("authRole");

            throw new Error("Your session expired. Please log in again.");
        }

        if (response.status === 403) {
            throw new Error(
                "You do not have permission to manage customers."
            );
        }

        const details = Object.values(data)
            .flat()
            .filter(value => typeof value === "string")
            .join(" ");

        throw new Error(
            details || data.detail || `Request failed (${response.status}).`
        );
    }

    return data;
}

async function loadCustomerForEditing() {
    if (!customerId) {
        setFormMode(false);
        return;
    }

    setFormMode(true);
    showMessage("Loading customer information...", false);

    try {
        const response = await fetch(
            `${API_BASE_URL}/customers/${encodeURIComponent(customerId)}/`,
            {
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Token ${token}`
                }
            }
        );

        const customer = await readResponse(response);

        fillCustomerForm(customer);

        if (messageElement) {
            messageElement.remove();
            messageElement = null;
        }
    } catch (error) {
        showMessage(error.message);
        if (saveButton) saveButton.disabled = true;
    }
}

async function saveCustomer(event) {
    event.preventDefault();

    if (!token || !["admin", "staff"].includes(role)) {
        showMessage(
            "Please log in with an authorised Admin or Staff account."
        );
        return;
    }

    const payload = getCustomerPayload();

    if (!payload.full_name || !payload.phone) {
        showMessage("Full Name and Phone Number are required.");
        return;
    }

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = customerId
            ? "Updating..."
            : "Saving...";
    }

    try {
        const editing = Boolean(customerId);

        const response = await fetch(
            editing
                ? `${API_BASE_URL}/customers/${encodeURIComponent(customerId)}/`
                : `${API_BASE_URL}/customers/`,
            {
                method: editing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify(payload)
            }
        );

        await readResponse(response);

        window.location.href = "customers.html";
    } catch (error) {
        showMessage(error.message);
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = customerId
                ? "Update Customer"
                : "Save Customer";
        }
    }
}

if (!customerForm) {
    console.error("Customer form was not found.");
} else if (!token) {
    showMessage("Please log in through the website before managing customers.");
    if (saveButton) saveButton.disabled = true;
} else if (!["admin", "staff"].includes(role)) {
    showMessage("Only authorised Admin or Staff accounts can manage customers.");
    if (saveButton) saveButton.disabled = true;
} else {
    customerForm.addEventListener("submit", saveCustomer);
    loadCustomerForEditing();
}

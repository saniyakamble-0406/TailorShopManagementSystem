
"use strict";

// ==========================================
// API AND FORM ELEMENTS
// ==========================================

const SERVICES_API_URL = "http://127.0.0.1:8000/api/services/";

const serviceForm = document.querySelector(".customer-form");
const params = new URLSearchParams(window.location.search);
const serviceId = params.get("id");

const serviceNameInput = document.getElementById("service_name");
const priceInput = document.getElementById("price");
const daysInput = document.getElementById("estimated_days");
const statusInput = document.getElementById("is_active");
const descriptionInput = document.getElementById("description");

const pageTitle = document.querySelector(".form-header h1");
const pageSubtitle = document.querySelector(".form-header p");
const sectionTitle = document.querySelector(".form-section h2");
const saveButton = serviceForm?.querySelector('button[type="submit"]');

let messageElement;


// ==========================================
// SHOW FORM MESSAGE
// ==========================================

function showMessage(message, isError = true) {
    if (!messageElement) {
        messageElement = document.createElement("p");
        messageElement.setAttribute("role", "status");
        messageElement.setAttribute("aria-live", "polite");

        serviceForm?.prepend(messageElement);
    }

    messageElement.textContent = message;
    messageElement.style.color = isError ? "#B42318" : "#28754A";
}


// ==========================================
// SET ADD OR EDIT MODE
// ==========================================

function setFormMode(isEditing) {
    if (pageTitle) {
        pageTitle.textContent = isEditing
            ? "Edit Tailoring Service"
            : "Add Tailoring Service";
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = isEditing
            ? "Update service details, price and completion time"
            : "Enter service details, price and completion time";
    }

    if (sectionTitle) {
        sectionTitle.textContent = isEditing
            ? "Edit Service Information"
            : "Service Information";
    }

    if (saveButton) {
        saveButton.textContent = isEditing
            ? "Update Service"
            : "Save Service";
    }

    document.title = isEditing
        ? "Edit Service - Tailor Shop Management System"
        : "Add Service - Tailor Shop Management System";
}


// ==========================================
// READ API RESPONSE
// ==========================================

async function readResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("authUsername");
            sessionStorage.removeItem("authRole");

            throw new Error(
                "Your session has expired. Please log in again."
            );
        }

        if (response.status === 403) {
            throw new Error(
                "Your account does not have permission to manage services."
            );
        }

        if (response.status === 404) {
            throw new Error("Service record not found.");
        }

        const errors = Object.entries(data)
            .map(([field, messages]) => {
                const text = Array.isArray(messages)
                    ? messages.join(" ")
                    : String(messages);

                return `${field}: ${text}`;
            })
            .join(" ");

        throw new Error(
            errors || data.detail || `Request failed: HTTP ${response.status}`
        );
    }

    return data;
}


// ==========================================
// FILL FORM FOR EDITING
// ==========================================

function fillServiceForm(service) {
    serviceNameInput.value = service.service_name ?? "";
    priceInput.value = service.price ?? "";
    daysInput.value = service.estimated_days ?? "";
    statusInput.value = String(Boolean(service.is_active));
    descriptionInput.value = service.description ?? "";
}


async function loadServiceForEditing(token) {
    if (!serviceId) {
        setFormMode(false);
        return;
    }

    if (!/^\d+$/.test(serviceId)) {
        showMessage("Invalid service ID.");
        if (saveButton) saveButton.disabled = true;
        return;
    }

    setFormMode(true);
    showMessage("Loading service information...", false);

    try {
        const response = await fetch(
            `${SERVICES_API_URL}${encodeURIComponent(serviceId)}/`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Token ${token}`
                }
            }
        );

        const service = await readResponse(response);

        fillServiceForm(service);

        if (messageElement) {
            messageElement.remove();
            messageElement = null;
        }
    } catch (error) {
        showMessage(error.message);

        if (saveButton) {
            saveButton.disabled = true;
        }
    }
}


// ==========================================
// SAVE OR UPDATE SERVICE
// ==========================================

async function saveService(event) {
    event.preventDefault();

    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("authRole");

    if (!token) {
        showMessage("Please log in before managing services.");
        return;
    }

    if (!["admin", "staff"].includes(role)) {
        showMessage(
            "Your account does not have permission to manage services."
        );
        return;
    }

    const serviceName = serviceNameInput.value.trim();
    const description = descriptionInput.value.trim();
    const price = Number(priceInput.value);
    const estimatedDays = Number(daysInput.value);
    const isActive = statusInput.value === "true";

    if (!serviceName) {
        showMessage("Service Name is required.");
        serviceNameInput.focus();
        return;
    }

    if (
        priceInput.value.trim() === "" ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        showMessage("Enter a valid price of zero or more.");
        priceInput.focus();
        return;
    }

    if (
        daysInput.value.trim() === "" ||
        !Number.isInteger(estimatedDays) ||
        estimatedDays < 1
    ) {
        showMessage("Estimated Days must be a whole number of at least 1.");
        daysInput.focus();
        return;
    }

    const payload = {
        service_name: serviceName,
        description: description,
        price: price.toFixed(2),
        estimated_days: estimatedDays,
        is_active: isActive
    };

    const editing = Boolean(serviceId);

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = editing ? "Updating..." : "Saving...";
    }

    try {
        const url = editing
            ? `${SERVICES_API_URL}${encodeURIComponent(serviceId)}/`
            : SERVICES_API_URL;

        const response = await fetch(url, {
            method: editing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Token ${token}`
            },
            body: JSON.stringify(payload)
        });

        await readResponse(response);

        window.location.href = "services.html";
    } catch (error) {
        showMessage(error.message || "Could not save the service.");
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = editing
                ? "Update Service"
                : "Save Service";
        }
    }
}


// ==========================================
// INITIALISE SERVICE FORM
// ==========================================

async function initialiseServiceForm() {
    if (!serviceForm) {
        console.error("Service form was not found.");
        return;
    }

    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("authRole");

    if (!token) {
        showMessage("Please log in through the website before managing services.");

        if (saveButton) saveButton.disabled = true;
        return;
    }

    if (!["admin", "staff"].includes(role)) {
        showMessage("Your account does not have permission to manage services.");

        if (saveButton) saveButton.disabled = true;
        return;
    }

    serviceForm.addEventListener("submit", saveService);

    await loadServiceForEditing(token);
}

initialiseServiceForm();


"use strict";

// ==========================================
// API URLS AND FORM ELEMENTS
// ==========================================

const API_BASE = "http://127.0.0.1:8000/api";

const ORDERS_URL = `${API_BASE}/orders/`;
const CUSTOMERS_URL = `${API_BASE}/customers/`;
const SERVICES_URL = `${API_BASE}/services/`;
const ORDER_ITEMS_URL = `${API_BASE}/order-items/`;

const orderForm = document.querySelector(".customer-form");

const customerSelect = document.getElementById("customer");
const serviceSelect = document.getElementById("service");

const quantityInput = document.getElementById("quantity");
const unitPriceInput = document.getElementById("unit_price");
const subtotalInput = document.getElementById("subtotal");
const discountInput = document.getElementById("discount");
const finalAmountInput = document.getElementById("final_amount");

const orderNumberInput = document.getElementById("order_number");
const fabricSourceInput = document.getElementById("fabric_source");
const deliveryDateInput = document.getElementById("delivery_date");
const statusInput = document.getElementById("status");
const clothingTypeInput = document.getElementById("clothing_type");
const instructionsInput = document.getElementById("special_instructions");

const pageTitle = document.querySelector(".form-header h1");
const pageSubtitle = document.querySelector(".form-header p");
const sectionTitle = document.querySelector(".form-section h2");
const saveButton = orderForm?.querySelector('button[type="submit"]');

const params = new URLSearchParams(window.location.search);
const orderId = params.get("id");

let allCustomers = [];
let allServices = [];
let existingOrderItem = null;
let partialOrderCreated = false;
let messageElement;


// ==========================================
// MESSAGE
// ==========================================

function showMessage(message, isError = true) {
    if (!messageElement) {
        messageElement = document.createElement("p");
        messageElement.setAttribute("role", "status");
        messageElement.setAttribute("aria-live", "polite");
        orderForm?.prepend(messageElement);
    }

    messageElement.textContent = message;
    messageElement.style.color = isError ? "#B42318" : "#28754A";
}


// ==========================================
// API HELPERS
// ==========================================

function getList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

async function apiRequest(url, options = {}) {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        throw new Error("Please log in before managing orders.");
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            "Accept": "application/json",
            "Authorization": `Token ${token}`,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("authUsername");
            sessionStorage.removeItem("authRole");

            throw new Error("Your session expired. Please log in again.");
        }

        if (response.status === 403) {
            throw new Error("You do not have permission to manage orders.");
        }

        const details = Object.entries(data)
            .map(([field, messages]) => {
                const text = Array.isArray(messages)
                    ? messages.join(" ")
                    : String(messages);

                return `${field}: ${text}`;
            })
            .join(" ");

        throw new Error(
            details || data.detail || `Request failed: HTTP ${response.status}`
        );
    }

    return data;
}


// ==========================================
// LOAD CUSTOMER OPTIONS
// ==========================================

function populateCustomers(customers) {
    customerSelect.replaceChildren(
        new Option("Select Customer", "")
    );

    customers.forEach(customer => {
        const option = new Option(
            customer.full_name || `Customer ${customer.id}`,
            String(customer.id)
        );

        customerSelect.add(option);
    });
}


// ==========================================
// LOAD SERVICE OPTIONS
// ==========================================

function populateServices(services) {
    serviceSelect.replaceChildren(
        new Option("Select Service", "")
    );

    services.forEach(service => {
        if (!service.is_active) return;

        const option = new Option(
            `${service.service_name} (₹${service.price})`,
            String(service.id)
        );

        serviceSelect.add(option);
    });
}


// ==========================================
// PRICE CALCULATION
// ==========================================

function updateAmounts() {
    const quantity = Number(quantityInput.value) || 0;
    const unitPrice = Number(unitPriceInput.value) || 0;
    const discount = Number(discountInput.value) || 0;

    const subtotal = quantity * unitPrice;
    const finalAmount = Math.max(0, subtotal - discount);

    subtotalInput.value = subtotal.toFixed(2);
    finalAmountInput.value = finalAmount.toFixed(2);
}


function updatePriceFromService() {
    const selectedService = allServices.find(service =>
        String(service.id) === serviceSelect.value
    );

    if (selectedService) {
        unitPriceInput.value = Number(selectedService.price).toFixed(2);
        updateAmounts();
    }
}


// ==========================================
// LOAD CUSTOMER AND SERVICE DATA
// ==========================================

async function loadCustomersAndServices() {
    const [customersData, servicesData] = await Promise.all([
        apiRequest(CUSTOMERS_URL),
        apiRequest(SERVICES_URL)
    ]);

    allCustomers = getList(customersData);
    allServices = getList(servicesData);

    populateCustomers(allCustomers);
    populateServices(allServices);
}


// ==========================================
// FORM MODE
// ==========================================

function setFormMode(isEditing) {
    if (pageTitle) {
        pageTitle.textContent = isEditing
            ? "Edit Order"
            : "Create New Order";
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = isEditing
            ? "Update customer, clothing and delivery details"
            : "Enter customer, clothing and delivery details";
    }

    if (sectionTitle) {
        sectionTitle.textContent = isEditing
            ? "Edit Order Information"
            : "Order Information";
    }

    if (saveButton) {
        saveButton.textContent = isEditing
            ? "Update Order"
            : "Save Order";
    }

    document.title = isEditing
        ? "Edit Order - Tailor Shop Management System"
        : "Create Order - Tailor Shop Management System";
}


// ==========================================
// LOAD ORDER FOR EDITING
// ==========================================

async function loadOrderForEditing() {
    if (!orderId) {
        setFormMode(false);
        return;
    }

    if (!/^\d+$/.test(orderId)) {
        throw new Error("Invalid order ID.");
    }

    setFormMode(true);

    const [order, itemsData] = await Promise.all([
        apiRequest(`${ORDERS_URL}${encodeURIComponent(orderId)}/`),
        apiRequest(ORDER_ITEMS_URL)
    ]);

    const orderItems = getList(itemsData).filter(item =>
        Number(item.order) === Number(order.id)
    );

    if (orderItems.length > 1) {
        throw new Error(
            "This order contains multiple clothing items. " +
            "The current form supports editing one item at a time."
        );
    }

    existingOrderItem = orderItems[0] || null;

    orderNumberInput.value = order.order_number || "";
    customerSelect.value = String(order.customer ?? "");
    fabricSourceInput.value = order.fabric_source || "";
    deliveryDateInput.value = order.delivery_date || "";
    statusInput.value = order.status || "received";
    discountInput.value = order.discount ?? 0;
    instructionsInput.value = order.special_instructions || "";

    if (existingOrderItem) {
        serviceSelect.value = String(existingOrderItem.service);
        clothingTypeInput.value = existingOrderItem.clothing_type || "";
        quantityInput.value = existingOrderItem.quantity ?? 1;
        unitPriceInput.value = existingOrderItem.unit_price ?? 0;
        subtotalInput.value = existingOrderItem.subtotal ?? 0;
    }

    finalAmountInput.value = order.final_amount ?? 0;
}


// ==========================================
// VALIDATION
// ==========================================

function validateOrder() {
    if (!orderNumberInput.value.trim()) {
        throw new Error("Order Number is required.");
    }

    if (!customerSelect.value) {
        throw new Error("Please select a customer.");
    }

    if (!fabricSourceInput.value) {
        throw new Error("Please select a fabric source.");
    }

    if (!serviceSelect.value) {
        throw new Error("Please select a tailoring service.");
    }

    if (!clothingTypeInput.value) {
        throw new Error("Please select the clothing type.");
    }

    if (!deliveryDateInput.value) {
        throw new Error("Delivery Date is required.");
    }

    const quantity = Number(quantityInput.value);
    const unitPrice = Number(unitPriceInput.value);
    const discount = Number(discountInput.value);

    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Quantity must be at least 1.");
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error("Enter a valid unit price.");
    }

    if (!Number.isFinite(discount) || discount < 0) {
        throw new Error("Enter a valid discount.");
    }

    if (discount > quantity * unitPrice) {
        throw new Error("Discount cannot exceed the subtotal.");
    }
}


// ==========================================
// CREATE OR UPDATE ORDER
// ==========================================

async function saveOrder(event) {
    event.preventDefault();

    if (partialOrderCreated) {
        showMessage(
            "The order was created, but its clothing item was not saved. " +
            "Check the Orders page before trying again."
        );
        return;
    }

    const role = sessionStorage.getItem("authRole");

    if (!["admin", "staff"].includes(role)) {
        showMessage("Only authorised Admin or Staff accounts can manage orders.");
        return;
    }

    try {
        validateOrder();
        updateAmounts();
    } catch (error) {
        showMessage(error.message);
        return;
    }

    const quantity = Number(quantityInput.value);
    const unitPrice = Number(unitPriceInput.value);
    const subtotal = quantity * unitPrice;
    const discount = Number(discountInput.value) || 0;

    const orderPayload = {
        order_number: orderNumberInput.value.trim(),
        customer: Number(customerSelect.value),
        fabric_source: fabricSourceInput.value,
        special_instructions: instructionsInput.value.trim(),
        discount: discount.toFixed(2),
        final_amount: Math.max(0, subtotal - discount).toFixed(2),
        delivery_date: deliveryDateInput.value,
        status: statusInput.value
    };

    const itemPayload = {
        service: Number(serviceSelect.value),
        measurement: existingOrderItem?.measurement ?? null,
        clothing_type: clothingTypeInput.value,
        quantity: quantity,
        unit_price: unitPrice.toFixed(2),
        subtotal: subtotal.toFixed(2)
    };

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = orderId ? "Updating..." : "Saving...";
    }

    try {
        if (orderId) {
            const updatedOrder = await apiRequest(
                `${ORDERS_URL}${encodeURIComponent(orderId)}/`,
                {
                    method: "PUT",
                    body: JSON.stringify(orderPayload)
                }
            );

            itemPayload.order = Number(updatedOrder.id);

            if (existingOrderItem) {
                await apiRequest(
                    `${ORDER_ITEMS_URL}${encodeURIComponent(existingOrderItem.id)}/`,
                    {
                        method: "PUT",
                        body: JSON.stringify(itemPayload)
                    }
                );
            } else {
                await apiRequest(ORDER_ITEMS_URL, {
                    method: "POST",
                    body: JSON.stringify(itemPayload)
                });
            }
        } else {
            const createdOrder = await apiRequest(ORDERS_URL, {
                method: "POST",
                body: JSON.stringify(orderPayload)
            });

            itemPayload.order = Number(createdOrder.id);

            try {
                await apiRequest(ORDER_ITEMS_URL, {
                    method: "POST",
                    body: JSON.stringify(itemPayload)
                });
            } catch (itemError) {
                partialOrderCreated = true;

                if (saveButton) {
                    saveButton.disabled = true;
                }

                throw new Error(
                    `Order ${createdOrder.order_number} was created, ` +
                    `but its clothing item could not be saved. ` +
                    `Do not submit again; check Orders first. ` +
                    `Reason: ${itemError.message}`
                );
            }
        }

        window.location.href = "orders.html";

    } catch (error) {
        showMessage(error.message || "Could not save the order.");
    } finally {
        if (saveButton && !partialOrderCreated) {
            saveButton.disabled = false;
            saveButton.textContent = orderId
                ? "Update Order"
                : "Save Order";
        }
    }
}


// ==========================================
// INITIALISE FORM
// ==========================================

async function initialiseOrderForm() {
    if (!orderForm) {
        console.error("Order form was not found.");
        return;
    }

    const token = sessionStorage.getItem("authToken");

    if (!token) {
        showMessage("Please log in before managing orders.");
        if (saveButton) saveButton.disabled = true;
        return;
    }

    orderForm.addEventListener("submit", saveOrder);

    serviceSelect.addEventListener("change", updatePriceFromService);
    quantityInput.addEventListener("input", updateAmounts);
    unitPriceInput.addEventListener("input", updateAmounts);
    discountInput.addEventListener("input", updateAmounts);

    try {
        await loadCustomersAndServices();
        await loadOrderForEditing();

        if (messageElement) {
            messageElement.remove();
            messageElement = null;
        }

        if (!orderId) {
            updateAmounts();
        }
    } catch (error) {
        showMessage(error.message || "Could not initialise the order form.");

        if (saveButton) {
            saveButton.disabled = true;
        }
    }
}

initialiseOrderForm();

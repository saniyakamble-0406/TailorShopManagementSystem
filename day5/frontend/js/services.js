
"use strict";

// ==========================================
// API AND HTML ELEMENTS
// ==========================================

const SERVICES_API_URL = "http://127.0.0.1:8000/api/services/";

const serviceTableBody = document.querySelector(".table-section tbody");
const serviceSearch = document.getElementById("service-search");

const suggestionBox = document.getElementById("service-inline-suggestion");
const suggestionPrefix = document.getElementById("service-suggestion-prefix");
const suggestionSuffix = document.getElementById("service-suggestion-suffix");

let allServices = [];
let suggestedServiceName = "";


// ==========================================
// INLINE SUGGESTION SETUP
// ==========================================

function setupInlineSuggestion() {
    if (!serviceSearch || !suggestionBox ||
        !suggestionPrefix || !suggestionSuffix) {
        console.error("Service inline-suggestion HTML elements were not found.");
        return;
    }

    const inputStyle = window.getComputedStyle(serviceSearch);

    // Keep the input interactive and place the suggestion over its text.
    serviceSearch.style.position = "relative";
    serviceSearch.style.zIndex = "1";
    serviceSearch.style.width = "100%";
    serviceSearch.style.boxSizing = "border-box";
    serviceSearch.style.backgroundColor = "transparent";

    Object.assign(suggestionBox.style, {
        position: "absolute",
        inset: "0",
        zIndex: "2",
        display: "none",
        boxSizing: "border-box",
        overflow: "hidden",
        whiteSpace: "pre",
        pointerEvents: "none",
        backgroundColor: "transparent",
        borderStyle: "solid",
        borderColor: "transparent"
    });

    // Match the input font and text alignment.
    const matchingStyles = [
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "lineHeight",
        "letterSpacing",
        "wordSpacing",
        "textAlign",
        "textTransform",
        "textIndent"
    ];

    matchingStyles.forEach(property => {
        suggestionBox.style[property] = inputStyle[property];
    });

    // Match the input text's starting position.
    const borderLeft = parseFloat(inputStyle.borderLeftWidth) || 0;
    const borderTop = parseFloat(inputStyle.borderTopWidth) || 0;
    const paddingLeft = parseFloat(inputStyle.paddingLeft) || 0;
    const paddingTop = parseFloat(inputStyle.paddingTop) || 0;

    suggestionBox.style.paddingLeft =
        `${borderLeft + paddingLeft}px`;

    suggestionBox.style.paddingTop =
        `${borderTop + paddingTop}px`;

    suggestionPrefix.style.color = "transparent";
    suggestionSuffix.style.color = "#9CA3AF";
}


// ==========================================
// HIDE INLINE SUGGESTION
// ==========================================

function hideInlineSuggestion() {
    suggestedServiceName = "";

    if (suggestionBox) {
        suggestionBox.hidden = true;
        suggestionBox.style.display = "none";
    }

    if (suggestionPrefix) {
        suggestionPrefix.textContent = "";
    }

    if (suggestionSuffix) {
        suggestionSuffix.textContent = "";
    }
}


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
// TABLE MESSAGE
// ==========================================

function showTableMessage(message) {
    if (!serviceTableBody) return;

    serviceTableBody.innerHTML = `
        <tr>
            <td colspan="7">${escapeHTML(message)}</td>
        </tr>
    `;
}


// ==========================================
// RENDER SERVICES TABLE
// ==========================================

function renderServices(services) {
    if (!serviceTableBody) return;

    if (services.length === 0) {
        showTableMessage("No services found.");
        return;
    }

    serviceTableBody.innerHTML = services.map(service => {
        const id = encodeURIComponent(String(service.id));

        const price = Number(service.price);
        const formattedPrice = Number.isFinite(price)
            ? price.toFixed(2)
            : String(service.price ?? "—");

        return `
            <tr>
                <td>${escapeHTML(service.id)}</td>
                <td>${escapeHTML(service.service_name)}</td>
                <td>${escapeHTML(service.description || "—")}</td>
                <td>${escapeHTML(formattedPrice)}</td>
                <td>${escapeHTML(service.estimated_days ?? "—")}</td>
                <td>${service.is_active ? "Active" : "Inactive"}</td>
                <td>
                    <a href="service-form.html?id=${id}">Edit</a>
                </td>
            </tr>
        `;
    }).join("");
}


// ==========================================
// FILTER SERVICES
// ==========================================

function filterServices() {
    const query = (serviceSearch?.value || "")
        .trim()
        .toLowerCase();

    const filteredServices = allServices.filter(service => {
        const values = [
            service.service_name,
            service.description,
            service.price,
            service.estimated_days,
            service.is_active ? "active" : "inactive"
        ];

        return values.some(value =>
            String(value ?? "").toLowerCase().includes(query)
        );
    });

    renderServices(filteredServices);
}


// ==========================================
// INLINE AUTOCOMPLETE IN THE SAME SEARCH BOX
// ==========================================

function updateInlineSuggestion() {
    if (!serviceSearch || !suggestionBox ||
        !suggestionPrefix || !suggestionSuffix) {
        return;
    }

    hideInlineSuggestion();

    const typedText = serviceSearch.value;

    // Show a completion only after at least two characters.
    if (typedText.trim().length < 2) return;

    // Keep the overlay aligned with text without leading/trailing spaces.
    if (typedText !== typedText.trim()) return;

    const query = typedText.toLowerCase();

    // Find services whose names begin with the exact typed prefix.
    const matches = allServices.filter(service => {
        const name = String(service.service_name ?? "");

        return (
            name.toLowerCase().startsWith(query) &&
            name.length > typedText.length
        );
    });

    // Only autocomplete when one service name matches uniquely.
    if (matches.length !== 1) return;

    suggestedServiceName = String(matches[0].service_name);

    suggestionPrefix.textContent = typedText;
    suggestionSuffix.textContent =
        suggestedServiceName.slice(typedText.length);

    suggestionBox.hidden = false;
    suggestionBox.style.display = "block";
}


// ==========================================
// ACCEPT SUGGESTION
// ==========================================

function acceptInlineSuggestion() {
    if (!suggestedServiceName || !serviceSearch) return;

    serviceSearch.value = suggestedServiceName;

    hideInlineSuggestion();
    filterServices();

    serviceSearch.focus();

    serviceSearch.setSelectionRange(
        serviceSearch.value.length,
        serviceSearch.value.length
    );
}


// ==========================================
// LOAD SERVICES FROM DJANGO API
// ==========================================

async function loadServices() {
    if (!serviceTableBody) {
        console.error("Services table was not found.");
        return;
    }

    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("authRole");

    if (!token) {
        showTableMessage(
            "Please log in through the website to view services."
        );
        return;
    }

    if (!["admin", "staff", "customer"].includes(role)) {
        showTableMessage(
            "Your account does not have permission to view services."
        );
        return;
    }

    showTableMessage("Loading services...");

    try {
        const response = await fetch(SERVICES_API_URL, {
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
                "Your login session has expired. Please log in again."
            );
            return;
        }

        if (!response.ok) {
            throw new Error(
                `Could not load services (HTTP ${response.status}).`
            );
        }

        const data = await response.json();

        allServices = Array.isArray(data)
            ? data
            : Array.isArray(data.results)
                ? data.results
                : [];

        filterServices();
        updateInlineSuggestion();

    } catch (error) {
        console.error("Services API error:", error);

        showTableMessage(
            "Could not load services. Check the backend and try again."
        );
    }
}


// ==========================================
// SEARCH EVENTS
// ==========================================

if (serviceSearch) {
    serviceSearch.addEventListener("input", () => {
        filterServices();
        updateInlineSuggestion();
    });

    serviceSearch.addEventListener("keydown", event => {
        if (
            suggestedServiceName &&
            event.key === "ArrowRight" &&
            serviceSearch.selectionStart === serviceSearch.value.length &&
            serviceSearch.selectionEnd === serviceSearch.value.length
        ) {
            event.preventDefault();
            acceptInlineSuggestion();
        } else if (
            suggestedServiceName &&
            event.key === "Tab"
        ) {
            acceptInlineSuggestion();
        } else if (event.key === "Escape") {
            hideInlineSuggestion();
        }
    });
}


// ==========================================
// INITIALISE PAGE
// ==========================================

setupInlineSuggestion();
loadServices();

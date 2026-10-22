
"use strict";

// ==========================================
// API AND HTML ELEMENTS
// ==========================================

const STAFF_API_URL = "http://127.0.0.1:8000/api/staff/";

const staffTableBody = document.querySelector(".table-section tbody");
const staffSearch = document.getElementById("staff-search");

const suggestionBox = document.getElementById("staff-inline-suggestion");
const suggestionPrefix = document.getElementById("staff-suggestion-prefix");
const suggestionSuffix = document.getElementById("staff-suggestion-suffix");

let allStaff = [];
let suggestedName = "";


// ==========================================
// INLINE SUGGESTION SETUP
// ==========================================

function setupInlineSuggestion() {
    if (!staffSearch || !suggestionBox) {
        console.error("Staff search suggestion elements were not found.");
        return;
    }

    const inputStyle = window.getComputedStyle(staffSearch);

    staffSearch.style.position = "relative";
    staffSearch.style.zIndex = "1";
    staffSearch.style.width = "100%";
    staffSearch.style.boxSizing = "border-box";

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
        "textIndent",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        "borderTopWidth",
        "borderRightWidth",
        "borderBottomWidth",
        "borderLeftWidth"
    ];

    matchingStyles.forEach(property => {
        suggestionBox.style[property] = inputStyle[property];
    });

    if (suggestionPrefix) {
        suggestionPrefix.style.color = "transparent";
    }

    if (suggestionSuffix) {
        suggestionSuffix.style.color = "#9CA3AF";
    }
}


// ==========================================
// HIDE SUGGESTION
// ==========================================

function hideSuggestion() {
    suggestedName = "";

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
    if (!staffTableBody) return;

    staffTableBody.innerHTML = `
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

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}


// ==========================================
// STAFF ID FORMATTING
// ==========================================

function getStaffCode(staff) {
    return "STF-" + String(staff.id).padStart(3, "0");
}


// ==========================================
// RENDER STAFF TABLE
// ==========================================

function renderStaff(staffList) {
    if (!staffTableBody) return;

    if (staffList.length === 0) {
        showTableMessage("No staff records found.");
        return;
    }

    staffTableBody.innerHTML = staffList.map(staff => {
        const id = encodeURIComponent(String(staff.id));
        const staffCode = getStaffCode(staff);

        const statusText = staff.is_active
            ? "Active"
            : "Inactive";

        return `
            <tr>
                <td>${escapeHTML(staffCode)}</td>
                <td>${escapeHTML(staff.full_name)}</td>
                <td>${escapeHTML(staff.phone)}</td>
                <td>${escapeHTML(staff.address || "—")}</td>
                <td>${escapeHTML(formatDate(staff.joined_date))}</td>
                <td>${escapeHTML(statusText)}</td>
                <td>
                    <a href="staff-form.html?id=${id}">Edit</a>
                </td>
            </tr>
        `;
    }).join("");
}


// ==========================================
// FILTER STAFF TABLE
// ==========================================

function filterStaff() {
    const query = (staffSearch?.value || "")
        .trim()
        .toLowerCase();

    const filteredStaff = allStaff.filter(staff => {
        const staffCode = getStaffCode(staff);

        const values = [
            staffCode,
            staff.id,
            staff.full_name,
            staff.phone,
            staff.address,
            staff.joined_date,
            formatDate(staff.joined_date),
            staff.is_active ? "active" : "inactive"
        ];

        return values.some(value =>
            String(value ?? "").toLowerCase().includes(query)
        );
    });

    renderStaff(filteredStaff);
}


// ==========================================
// INLINE AUTOCOMPLETE
// ==========================================

function updateInlineSuggestion() {
    if (!staffSearch || !suggestionBox) return;

    hideSuggestion();

    const typedText = staffSearch.value;

    if (typedText.trim().length < 2) return;

    if (typedText !== typedText.trim()) return;

    const query = typedText.toLowerCase();

    // Suggestions are shown for staff names only.
    const match = allStaff.find(staff => {
        const name = String(staff.full_name ?? "");

        return (
            name.toLowerCase().startsWith(query) &&
            name.length > typedText.length
        );
    });

    if (!match || !suggestionPrefix || !suggestionSuffix) return;

    suggestedName = String(match.full_name);

    suggestionPrefix.textContent = typedText;
    suggestionSuffix.textContent =
        suggestedName.slice(typedText.length);

    suggestionBox.hidden = false;
    suggestionBox.style.display = "block";
}


// ==========================================
// ACCEPT SUGGESTION
// ==========================================

function acceptSuggestion() {
    if (!suggestedName || !staffSearch) return;

    staffSearch.value = suggestedName;

    hideSuggestion();
    filterStaff();

    staffSearch.focus();

    staffSearch.setSelectionRange(
        staffSearch.value.length,
        staffSearch.value.length
    );
}


// ==========================================
// LOAD STAFF FROM DJANGO API
// ==========================================

async function loadStaff() {
    if (!staffTableBody) {
        console.error("Staff table was not found.");
        return;
    }

    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("authRole");

    if (!token) {
        showTableMessage(
            "Please log in through the website to view staff records."
        );
        return;
    }

    if (!["admin", "staff"].includes(role)) {
        showTableMessage(
            "Your account does not have permission to view staff records."
        );
        return;
    }

    showTableMessage("Loading staff records...");

    try {
        const response = await fetch(STAFF_API_URL, {
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
            throw new Error(
                `Could not load staff records (HTTP ${response.status}).`
            );
        }

        const data = await response.json();

        allStaff = Array.isArray(data)
            ? data
            : Array.isArray(data.results)
                ? data.results
                : [];

        filterStaff();
        updateInlineSuggestion();

    } catch (error) {
        console.error("Staff API error:", error);

        showTableMessage(
            "Could not load staff records. Check the backend and try again."
        );
    }
}


// ==========================================
// SEARCH EVENTS
// ==========================================

if (staffSearch) {
    staffSearch.addEventListener("input", () => {
        filterStaff();
        updateInlineSuggestion();
    });

    staffSearch.addEventListener("keydown", event => {
        if (
            suggestedName &&
            event.key === "ArrowRight" &&
            staffSearch.selectionStart === staffSearch.value.length &&
            staffSearch.selectionEnd === staffSearch.value.length
        ) {
            event.preventDefault();
            acceptSuggestion();
        } else if (suggestedName && event.key === "Tab") {
            acceptSuggestion();
        } else if (event.key === "Escape") {
            hideSuggestion();
        }
    });
}


// ==========================================
// INITIALISE
// ==========================================

setupInlineSuggestion();
loadStaff();

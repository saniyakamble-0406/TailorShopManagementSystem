
"use strict";

const STAFF_API_URL = "http://127.0.0.1:8000/api/staff/";

const staffForm = document.querySelector(".customer-form");
const params = new URLSearchParams(window.location.search);
const staffId = params.get("id");

const token = sessionStorage.getItem("authToken");
const role = sessionStorage.getItem("authRole");

const pageTitle = document.querySelector(".form-header h1");
const pageSubtitle = document.querySelector(".form-header p");
const sectionTitle = document.querySelector(".form-section h2");
const saveButton = staffForm?.querySelector('button[type="submit"]');

let messageElement;


function showMessage(message, isError = true) {
    if (!messageElement) {
        messageElement = document.createElement("p");
        messageElement.setAttribute("role", "status");
        messageElement.setAttribute("aria-live", "polite");
        staffForm?.prepend(messageElement);
    }

    messageElement.textContent = message;
    messageElement.style.color = isError ? "#B42318" : "#28754A";
}


function setFormMode(isEditing) {
    if (pageTitle) {
        pageTitle.textContent = isEditing
            ? "Edit Staff Member"
            : "Add Staff Member";
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = isEditing
            ? "Update staff member information"
            : "Enter staff details and employment information";
    }

    if (sectionTitle) {
        sectionTitle.textContent = isEditing
            ? "Edit Staff Information"
            : "Staff Information";
    }

    if (saveButton) {
        saveButton.textContent = isEditing
            ? "Update Staff Member"
            : "Save Staff Member";
    }

    document.title = isEditing
        ? "Edit Staff - Tailor Shop Management System"
        : "Add Staff - Tailor Shop Management System";
}


function fillStaffForm(staff) {
    document.getElementById("full_name").value =
        staff.full_name || "";

    document.getElementById("phone").value =
        staff.phone || "";

    document.getElementById("joined_date").value =
        staff.joined_date || "";

    document.getElementById("is_active").value =
        String(Boolean(staff.is_active));

    document.getElementById("address").value =
        staff.address || "";
}


async function readResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("authUsername");
            sessionStorage.removeItem("authRole");

            throw new Error("Your session has expired. Please log in again.");
        }

        if (response.status === 403) {
            throw new Error(
                "Only an authorised Admin account can add or edit staff."
            );
        }

        if (response.status === 404) {
            throw new Error("Staff record not found.");
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
            errors || `Request failed with status ${response.status}.`
        );
    }

    return data;
}


async function loadStaffForEditing() {
    if (!staffId) {
        setFormMode(false);
        return;
    }

    setFormMode(true);
    showMessage("Loading staff information...", false);

    try {
        const response = await fetch(
            `${STAFF_API_URL}${encodeURIComponent(staffId)}/`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Token ${token}`
                }
            }
        );

        const staff = await readResponse(response);

        fillStaffForm(staff);

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


async function saveStaff(event) {
    event.preventDefault();

    if (!token) {
        showMessage("Please log in before managing staff.");
        return;
    }

    if (role !== "admin") {
        showMessage("Only an Admin account can add or edit staff.");
        return;
    }

    const fullName =
        document.getElementById("full_name").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const joinedDate =
        document.getElementById("joined_date").value;

    const address =
        document.getElementById("address").value.trim();

    const isActive =
        document.getElementById("is_active").value === "true";

    if (!fullName || !phone || !joinedDate) {
        showMessage(
            "Full Name, Phone Number and Joining Date are required."
        );
        return;
    }

    const payload = {
        full_name: fullName,
        phone: phone,
        address: address,
        joined_date: joinedDate,
        is_active: isActive
    };

    const editing = Boolean(staffId);

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = editing ? "Updating..." : "Saving...";
    }

    try {
        const response = await fetch(
            editing
                ? `${STAFF_API_URL}${encodeURIComponent(staffId)}/`
                : STAFF_API_URL,
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

        window.location.href = "staff.html";
    } catch (error) {
        showMessage(error.message);
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = editing
                ? "Update Staff Member"
                : "Save Staff Member";
        }
    }
}


if (!staffForm) {
    console.error("Staff form was not found.");
} else if (!token) {
    showMessage("Please log in through the website before managing staff.");

    if (saveButton) {
        saveButton.disabled = true;
    }
} else if (role !== "admin") {
    showMessage("Only an Admin account can manage staff.");

    if (saveButton) {
        saveButton.disabled = true;
    }
} else {
    staffForm.addEventListener("submit", saveStaff);
    loadStaffForEditing();
}

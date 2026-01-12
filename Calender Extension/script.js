const date = new Date();
let currYear = date.getFullYear();
let currMonth = date.getMonth();

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const renderCalendar = () => {
    // Construct first day of the current view
    // Note: Month is 0-indexed
    const firstDayObj = new Date(currYear, currMonth, 1);
    const lastDayObj = new Date(currYear, currMonth + 1, 0);
    const prevLastDayObj = new Date(currYear, currMonth, 0);
    const todayObj = new Date();

    const lastDay = lastDayObj.getDate();
    const prevLastDay = prevLastDayObj.getDate();
    const firstDayIndex = firstDayObj.getDay(); // 0 = Sunday

    const monthDisplay = document.querySelector(".month-year");
    const calendarBoard = document.querySelector(".calendar-board");

    monthDisplay.innerHTML = `${months[currMonth]} ${currYear}`;

    let daysHtml = "";

    // 1. Render Weekday Headers
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    weekDays.forEach(day => {
        daysHtml += `<div class="weekday-header">${day}</div>`;
    });

    // 2. Previous month cells (Padding)
    for (let x = firstDayIndex; x > 0; x--) {
        daysHtml += `<div class="day-cell prev-date">${prevLastDay - x + 1}</div>`;
    }

    // 3. Current month cells
    for (let i = 1; i <= lastDay; i++) {
        const isToday =
            i === todayObj.getDate() &&
            currMonth === todayObj.getMonth() &&
            currYear === todayObj.getFullYear();

        if (isToday) {
            daysHtml += `<div class="day-cell today">${i}</div>`;
        } else {
            daysHtml += `<div class="day-cell">${i}</div>`;
        }
    }

    // 4. Next month cells - Calculate remaining to fill 6 rows (42 date cells total)
    // Note: 42 date cells + 7 header cells = 49 items in grid? 
    // No, standard is usually just date cells for the 42 logic. 
    // But since we are in strict single grid, we just append.
    // The previous logic for `filledCells` = firstDayIndex + lastDay.
    // We want 42 *DATE* cells displayed.

    const filledDateCells = firstDayIndex + lastDay;
    const remainingCells = 42 - filledDateCells;

    for (let j = 1; j <= remainingCells; j++) {
        daysHtml += `<div class="day-cell next-date">${j}</div>`;
    }

    calendarBoard.innerHTML = daysHtml;
};

document.querySelector(".prev").addEventListener("click", () => {
    currMonth--;
    if (currMonth < 0) {
        currMonth = 11;
        currYear--;
    }
    renderCalendar();
});

document.querySelector(".next").addEventListener("click", () => {
    currMonth++;
    if (currMonth > 11) {
        currMonth = 0;
        currYear++;
    }
    renderCalendar();
});

// Footer Logic
document.getElementById("btn-today").addEventListener("click", () => {
    const now = new Date();
    currMonth = now.getMonth();
    currYear = now.getFullYear();
    renderCalendar();
});

document.getElementById("btn-add-event").addEventListener("click", () => {
    // Open Google Calendar create event page
    window.open("https://calendar.google.com/calendar/u/0/r/eventedit", "_blank");
});

renderCalendar();
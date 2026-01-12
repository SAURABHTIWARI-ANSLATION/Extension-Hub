const date = new Date("2026-01-08T10:38:16+05:30");
const renderShim = () => {
    date.setDate(1); 
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const prevLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
    const firstDayIndex = date.getDay();
    console.log(`Date: ${date.toDateString()}`);
    console.log(`PrevLast: ${prevLastDay}, FirstDayIndex: ${firstDayIndex}`);
    
    let grid = [];
    for (let x = firstDayIndex; x > 0; x--) {
        grid.push(`(${prevLastDay - x + 1})`);
    }
    for (let i = 1; i <= lastDay; i++) {
        grid.push(`${i}`);
    }
    
    console.log("Su	Mo	Tu	We	Th	Fr	Sa");
    let row = [];
    grid.forEach(cell => {
        row.push(cell);
        if (row.length === 7) {
            console.log(row.join("	"));
            row = [];
        }
    });
    if(row.length) console.log(row.join("	"));
};
renderShim();

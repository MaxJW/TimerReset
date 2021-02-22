export const padWithZeroes = (number) => number.toString().padStart(2, "0"); //Pad number with zeroes (i.e. for timer and time)

//Event when clicking outside of a specific element (e.g. New todo element, click outside will cancel ToDo)
export function clickOutside(node) {
    const handleClick = event => {
        if (node && !node.contains(event.target) && !event.defaultPrevented) {
            node.dispatchEvent(
                new CustomEvent('click_outside', node)
            )
        }
    }
    document.addEventListener('click', handleClick, true);
    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    }
}

export function timeSince(seconds) {
    var totaltime = "";
    var weeks = Math.floor(seconds / (7 * 24 * 60 * 60));
    var days = Math.floor(seconds / (24 * 60 * 60)) - 7 * weeks;
    var hours =
        Math.floor(seconds / (60 * 60)) - 7 * 24 * weeks - 24 * days;
    var minutes =
        Math.floor(seconds / 60) -
        7 * 24 * 60 * weeks -
        24 * 60 * days -
        60 * hours;
    var seconds =
        Math.floor(seconds) -
        7 * 24 * 60 * 60 * weeks -
        24 * 60 * 60 * days -
        60 * 60 * hours -
        60 * minutes;
    totaltime =
        (weeks > 1 ? weeks + " weeks, " : "") +
        (days > 1 ? days + " days, " : "") +
        (hours > 1 ? hours + " hours, " : "") +
        (minutes > 1 ? minutes + " minutes, " : "") +
        (seconds > 1 ? seconds + " seconds" : "");
    return totaltime == "" ? "N/A" : totaltime;
}
import { useEffect, useState } from "react";

export function useCustomDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Create a timeout to update the debounced value
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup on unmount or when value/delay changes
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}


// // Search debouncing
// const debouncedSearch = useCustomDebounce(searchQuery, 500);

// // Form input debouncing
// const debouncedFormValue = useCustomDebounce(formValue, 1000);

// // API call debouncing
// const debouncedApiParam = useCustomDebounce(apiParam, 300);

// // Scroll event debouncing
// const debouncedScrollPosition = useCustomDebounce(scrollPosition, 100);
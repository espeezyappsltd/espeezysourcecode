export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // Implementation for showing toast notifications
    // This can be integrated with a library like react-toastify or a custom solution
    if (typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }
}

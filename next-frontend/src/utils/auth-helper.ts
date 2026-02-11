export const handleAuthError = (res: Response) => {
    if (res.status === 401) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('session-expired'));
        }
        throw new Error('Session expired');
    }
};

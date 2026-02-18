import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-16" style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--text))' }}>
            <div className="text-center max-w-md space-y-4">
                <div className="text-8xl font-extrabold" style={{ color: 'rgb(var(--brand))' }}>404</div>
                <h1 className="text-2xl font-bold">Page not found</h1>
                <p style={{ color: 'rgb(var(--muted))' }}>
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link
                    to="/"
                    className="inline-block px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: 'rgb(var(--brand))' }}
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;

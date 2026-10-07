import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock } from 'lucide-react';
import { api } from '../core/api';

export function Login() {
    const [secret, setSecret] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await api.post('/api/login', { secret });
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-[var(--dt-bg-primary)] p-4">
            <div className="w-full max-w-md rounded-lg border border-[var(--dt-border)] bg-[var(--dt-bg-secondary)] p-8 shadow-lg">
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dt-accent-primary)]/10 text-[var(--dt-accent-primary)]">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--dt-text-primary)]">DevTools Login</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="login-secret" className="mb-1 block text-sm font-medium text-[var(--dt-text-secondary)]">
                            Shared secret
                        </label>
                        <input
                            id="login-secret"
                            type="password"
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            className="w-full rounded-md border border-[var(--dt-border)] bg-[var(--dt-bg-tertiary)] px-4 py-2 text-[var(--dt-text-primary)] focus:outline-none focus:ring-1"
                            placeholder="Enter shared secret..."
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    {error && <div role="alert" aria-live="assertive" className="text-sm text-red-500">{error}</div>}
                    <button type="submit" disabled={isLoading} className="w-full rounded-md bg-[var(--dt-accent-primary)] px-4 py-2 text-white">
                        {isLoading ? 'Authenticating...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

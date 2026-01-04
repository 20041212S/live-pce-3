'use client';

import { useState } from 'react';

export default function AdminSetupPage() {
  const [email, setEmail] = useState('chatbot.prc2025@gmail.com');
  const [password, setPassword] = useState('chat@2025');
  const [name, setName] = useState('Admin User');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<any>(null);

  const checkAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/setup-database');
      const data = await res.json();
      setCheckResult(data);
    } catch (error: any) {
      setCheckResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const res = await fetch('/api/admin/setup-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-admin',
          email: email.trim().toLowerCase(),
          password,
          name: name || 'Admin User',
        }),
      });
      
      const data = await res.json();
      setResult(data);
      
      if (data.success) {
        // Auto-check admins after creation
        setTimeout(() => checkAdmins(), 500);
      }
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Admin User Setup
        </h1>

        {/* Check Existing Admins */}
        <div className="mb-6">
          <button
            onClick={checkAdmins}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Existing Admins'}
          </button>
          
          {checkResult && (
            <div className={`mt-3 p-3 rounded-md ${
              checkResult.adminCount > 0 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
            }`}>
              {checkResult.adminCount > 0 ? (
                <div>
                  <p className="font-semibold">✅ Found {checkResult.adminCount} admin(s):</p>
                  <ul className="mt-2 list-disc list-inside">
                    {checkResult.admins.map((admin: any, idx: number) => (
                      <li key={idx}>{admin.email}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>❌ No admin users found. Create one below.</p>
              )}
            </div>
          )}
        </div>

        {/* Create Admin Form */}
        <form onSubmit={createAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Secure password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Admin User"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Creating...' : 'Create Admin User'}
          </button>
        </form>

        {/* Result Display */}
        {result && (
          <div className={`mt-4 p-4 rounded-md ${
            result.success 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {result.success ? (
              <div>
                <p className="font-semibold">✅ {result.message}</p>
                {result.user && (
                  <div className="mt-2 text-sm">
                    <p><strong>Email:</strong> {result.user.email}</p>
                    <p><strong>Name:</strong> {result.user.name}</p>
                    <p><strong>Role:</strong> {result.user.role}</p>
                  </div>
                )}
                <p className="mt-3 text-sm">
                  You can now <a href="/admin/login" className="underline font-semibold">login here</a>
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold">❌ Error: {result.error}</p>
                {result.error?.includes('already exists') && (
                  <p className="mt-2 text-sm">
                    Admin already exists. You can <a href="/admin/login" className="underline font-semibold">login here</a>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            This page is for initial setup only. After creating an admin, you can login at{' '}
            <a href="/admin/login" className="text-blue-600 hover:underline">/admin/login</a>
          </p>
        </div>
      </div>
    </div>
  );
}


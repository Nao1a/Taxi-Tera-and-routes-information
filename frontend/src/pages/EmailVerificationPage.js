import React from 'react';

const EmailVerificationPage = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-900 rounded-2xl shadow-lg text-center">
        <h1 className="text-2xl font-bold text-white">Verify your email</h1>
        <p className="text-gray-400">
          We’ve sent a verification link to your email. Please check your inbox to verify your account.
        </p>
        <button className="mt-4 w-full p-4 rounded-2xl border border-gray-500 text-white font-semibold text-lg hover:bg-gray-800">
          Resend verification email
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationPage;

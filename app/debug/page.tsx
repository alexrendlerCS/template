import { UserStatusDebugger } from "@/components/UserStatusDebugger";

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Debug Tool</h1>
          <p className="text-gray-600">
            Use this tool to check your account status and identify potential
            issues. If you're experiencing problems with the contract flow, this
            will help identify the cause.
          </p>
        </div>

        <UserStatusDebugger />

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            What This Tool Checks:
          </h2>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Your authentication status and session validity</li>
            <li>• Whether your user profile exists in the database</li>
            <li>• Your account permissions and role</li>
            <li>• Database read/write permissions</li>
            <li>• Storage bucket access for contract uploads</li>
            <li>• Session expiration and token status</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Common Issues:
          </h2>
          <ul className="text-yellow-700 space-y-1 text-sm">
            <li>
              • <strong>No session found:</strong> You need to log in again
            </li>
            <li>
              • <strong>Database errors:</strong> Your account may be corrupted
            </li>
            <li>
              • <strong>Storage permission errors:</strong> Contact support
            </li>
            <li>
              • <strong>Session expired:</strong> Refresh the page or log in
              again
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

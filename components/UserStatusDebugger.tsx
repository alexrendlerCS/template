"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react";

interface UserStatusData {
  status: string;
  user?: {
    id: string;
    email: string;
    emailConfirmed: string | null;
    createdAt: string;
    lastSignIn: string;
  };
  userData?: {
    contractAccepted: boolean;
    googleConnected: boolean;
    role: string;
    fullName: string;
  };
  databaseTest?: {
    canRead: boolean;
    canUpdate: boolean;
    updateError: any;
  };
  storageTest?: {
    contractsBucketExists: boolean;
    canUpload: boolean;
    uploadError: any;
  };
  session?: {
    expiresAt: number;
    refreshToken: boolean;
    accessToken: boolean;
  };
  error?: string;
  details?: any;
  timestamp: string;
}

export function UserStatusDebugger() {
  const [statusData, setStatusData] = useState<UserStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUserStatus = async () => {
    setLoading(true);
    setError(null);
    setStatusData(null);

    try {
      const response = await fetch("/api/debug/user-status");
      const data = await response.json();

      setStatusData(data);

      if (data.status === "error") {
        setError(data.error);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check user status"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Success
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          User Status Debugger
        </CardTitle>
        <CardDescription>
          Check your authentication status and identify potential issues with
          the contract flow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkUserStatus} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking Status...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Check User Status
            </>
          )}
        </Button>

        {error && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-800">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {statusData && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(statusData.status)}
                <span className="font-medium">Overall Status</span>
              </div>
              {getStatusBadge(statusData.status)}
            </div>

            {/* User Information */}
            {statusData.user && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>Email:</strong> {statusData.user.email}
                    </div>
                    <div>
                      <strong>ID:</strong> {statusData.user.id}
                    </div>
                    <div>
                      <strong>Email Confirmed:</strong>{" "}
                      {statusData.user.emailConfirmed ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Created:</strong>{" "}
                      {new Date(statusData.user.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Last Sign In:</strong>{" "}
                      {new Date(
                        statusData.user.lastSignIn
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Data */}
            {statusData.userData && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">User Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>Full Name:</strong>{" "}
                      {statusData.userData.fullName || "Not set"}
                    </div>
                    <div>
                      <strong>Role:</strong> {statusData.userData.role}
                    </div>
                    <div>
                      <strong>Contract Accepted:</strong>{" "}
                      {statusData.userData.contractAccepted ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Google Connected:</strong>{" "}
                      {statusData.userData.googleConnected ? "Yes" : "No"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Database Tests */}
            {statusData.databaseTest && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Database Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    {statusData.databaseTest.canRead ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Can Read User Data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusData.databaseTest.canUpdate ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Can Update User Data</span>
                  </div>
                  {statusData.databaseTest.updateError && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Update Error:</strong>{" "}
                      {JSON.stringify(statusData.databaseTest.updateError)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Storage Tests */}
            {statusData.storageTest && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Storage Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    {statusData.storageTest.contractsBucketExists ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Contracts Bucket Exists</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusData.storageTest.canUpload ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Can Upload Files</span>
                  </div>
                  {statusData.storageTest.uploadError && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Upload Error:</strong>{" "}
                      {JSON.stringify(statusData.storageTest.uploadError)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Session Information */}
            {statusData.session && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Session Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>Expires At:</strong>{" "}
                      {new Date(
                        statusData.session.expiresAt * 1000
                      ).toLocaleString()}
                    </div>
                    <div>
                      <strong>Has Refresh Token:</strong>{" "}
                      {statusData.session.refreshToken ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Has Access Token:</strong>{" "}
                      {statusData.session.accessToken ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Session Valid:</strong>{" "}
                      {statusData.session.expiresAt * 1000 > Date.now()
                        ? "Yes"
                        : "No"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-500 text-center">
              Last checked: {new Date(statusData.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

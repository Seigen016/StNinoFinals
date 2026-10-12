'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function TestPasswordChangePage() {
  const [userId, setUserId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkFlag = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/debug/set-password-flag?userId=${userId}`
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Failed to fetch' });
    }
    setLoading(false);
  };

  const setFlag = async (value: boolean) => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch('/api/debug/set-password-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, value }),
      });
      const data = await response.json();
      setResult(data);
      // Refresh to get updated value
      setTimeout(() => checkFlag(), 500);
    } catch (error) {
      setResult({ success: false, error: 'Failed to update' });
    }
    setLoading(false);
  };

  const getCurrentUser = () => {
    const student = localStorage.getItem('student');
    if (student) {
      const data = JSON.parse(student);
      setUserId(String(data.id));
      setTimeout(() => checkFlag(), 100);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Password Change Feature Test</CardTitle>
            <CardDescription>
              Test the mandatory password change feature by setting the flag on
              a user account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user ID (UUID)"
                  />
                  <Button onClick={getCurrentUser} variant="outline">
                    Use Current Student
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={checkFlag}
                  disabled={!userId || loading}
                  variant="outline"
                >
                  Check Current Flag
                </Button>
                <Button
                  onClick={() => setFlag(true)}
                  disabled={!userId || loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Set Flag to TRUE
                </Button>
                <Button
                  onClick={() => setFlag(false)}
                  disabled={!userId || loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Set Flag to FALSE
                </Button>
              </div>
            </div>

            {result && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">Result:</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Make sure you've run the database migration first</li>
                <li>
                  Click "Use Current Student" to get your logged-in student ID
                </li>
                <li>Click "Check Current Flag" to see the current value</li>
                <li>
                  Click "Set Flag to TRUE" to enable mandatory password change
                </li>
                <li>Refresh your student dashboard to see the modal appear</li>
                <li>
                  After changing password, the flag will automatically be set to
                  false
                </li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 text-amber-600">
                Database Migration:
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Run this SQL in your Supabase SQL Editor:
              </p>
              <Card className="bg-gray-900 text-gray-100">
                <CardContent className="p-4">
                  <pre className="text-xs overflow-auto">
                    {`ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN DEFAULT false;

COMMENT ON COLUMN users.password_change_required IS 
'Indicates if user must change password on next login (for admin-created accounts)';`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

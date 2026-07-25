import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsConditions() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full text-primary mb-2">
          <FileText className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Terms & Conditions</h1>
        <p className="text-muted-foreground text-lg">Last updated: July 26, 2026</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Account Registration & User Conduct</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Users must provide accurate email address, contact information, and date of birth during registration. Account sharing is strictly prohibited.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Tutoring Sessions & Cancellations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Tutoring sessions must be scheduled or rescheduled with at least 24 hours advance notice. Cancellations made less than 24 hours prior may be billed at full rate.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Payments & Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Invoices are issued according to selected package plans and due on specified dates. Accounts with overdue invoices may have access suspended until settlement.</p>
        </CardContent>
      </Card>
    </div>
  );
}

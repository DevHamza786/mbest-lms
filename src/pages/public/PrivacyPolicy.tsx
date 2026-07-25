import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full text-primary mb-2">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy & EULA</h1>
        <p className="text-muted-foreground text-lg">Last updated: July 26, 2026</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Data Collection & Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>MBEST LMS collects personal information necessary for providing educational services, including name, email address, phone number, date of birth, educational records, and profile details.</p>
          <p>This information is strictly used for course administration, tutoring session scheduling, billing processing, and performance tracking. We do not sell or trade personal data to third parties.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. End User License Agreement (EULA)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>By using the MBEST LMS platform and mobile applications, you agree to comply with all terms of this End User License Agreement:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>You are granted a non-exclusive, non-transferable license to access educational materials for personal learning.</li>
            <li>You agree not to redistribute, record, or publish course videos, documents, or assignments without explicit written consent.</li>
            <li>Obscene, harassment, or abusive behavior toward tutors or students will result in immediate account termination.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Data Security & Retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>We implement end-to-end encryption for transmitted credentials and utilize secure cloud infrastructure to protect user information. Student data is retained for the duration of enrollment plus statutory accounting record requirements.</p>
        </CardContent>
      </Card>
    </div>
  );
}

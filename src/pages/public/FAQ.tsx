import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      q: "How do I join an online tutoring class?",
      a: "Log in to your Student account, go to My Classes, and click 'Join Class' or click the meeting link on your scheduled class card."
    },
    {
      q: "How can parents upgrade or renew subscription packages?",
      a: "Parents can log in to the Parent Portal, navigate to Billing & Packages, and select 'Upgrade Package' or select an existing student profile to manage enrollments."
    },
    {
      q: "Where can I view assignment feedback and grades?",
      a: "Students and parents can access Grades or Assignment Submissions to view score breakdowns, feedback notes, and tutor comments."
    },
    {
      q: "What should I do if a tutor profile shows incomplete?",
      a: "Ensure your phone number, address, hourly rate, specialized subjects, and WWCC details with a valid future expiry date are all submitted."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full text-primary mb-2">
          <HelpCircle className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
        <p className="text-muted-foreground text-lg">Find answers to common questions about MBEST LMS</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{faq.q}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{faq.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
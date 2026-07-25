import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Mail, Phone, MessageSquare } from "lucide-react";

export default function HelpSupport() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full text-primary mb-2">
          <HelpCircle className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground text-lg">We are here to assist you with any platform or class inquiry</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="text-center p-6">
          <CardContent className="space-y-3 pt-4">
            <Mail className="h-8 w-8 mx-auto text-primary" />
            <h3 className="font-semibold text-lg">Email Support</h3>
            <p className="text-sm text-muted-foreground">support@mbest.edu.au</p>
          </CardContent>
        </Card>

        <Card className="text-center p-6">
          <CardContent className="space-y-3 pt-4">
            <Phone className="h-8 w-8 mx-auto text-primary" />
            <h3 className="font-semibold text-lg">Phone Assistance</h3>
            <p className="text-sm text-muted-foreground">+61 1300 000 123</p>
          </CardContent>
        </Card>

        <Card className="text-center p-6">
          <CardContent className="space-y-3 pt-4">
            <MessageSquare className="h-8 w-8 mx-auto text-primary" />
            <h3 className="font-semibold text-lg">Live Inquiry</h3>
            <p className="text-sm text-muted-foreground">Mon-Fri 9:00 AM - 6:00 PM AEST</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

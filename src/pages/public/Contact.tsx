import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Send,
  Building,
  MessageCircle,
  Facebook,
  Instagram
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ModernNavbar } from "@/components/common/ModernNavbar";
import { ModernFooter } from "@/components/common/ModernFooter";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { StaggeredReveal } from "@/components/animations/StaggeredReveal";
import { motion } from "framer-motion";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const { toast } = useToast();

  const contactInfo = [
    {
      icon: <Phone className="h-6 w-6 text-primary" />,
      title: "Phone",
      details: "(555) 123-4567",
      subtext: "Mon-Fri 9AM-7PM, Sat 9AM-5PM"
    },
    {
      icon: <Mail className="h-6 w-6 text-primary" />,
      title: "Email",
      details: "info@mbest.edu",
      subtext: "We'll respond within 24 hours"
    },
    {
      icon: <MapPin className="h-6 w-6 text-primary" />,
      title: "Address",
      details: "123 Education Street",
      subtext: "Learning City, NSW 2000"
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "Business Hours",
      details: "Mon-Fri: 9AM-7PM",
      subtext: "Saturday: 9AM-5PM, Sunday: Closed"
    }
  ];

  const businessDetails = [
    {
      label: "Business Name",
      value: "MBEST Tutoring Centre Pty Ltd"
    },
    {
      label: "ABN",
      value: "12 345 678 901"
    },
    {
      label: "Registration",
      value: "NSW Department of Education"
    },
    {
      label: "Insurance",
      value: "Professional Indemnity & Public Liability"
    }
  ];

  const faqItems = [
    {
      question: "What subjects do you tutor?",
      answer: "We specialize in Mathematics (Years 1-12), English (Years 1-6), and Science (Years 7-10). We also offer specialized exam preparation for OC Tests, Selective School entry, and HSC."
    },
    {
      question: "Do you offer online tutoring?",
      answer: "Yes, we offer both in-person and online tutoring sessions. Our online platform includes interactive whiteboards and digital resources for effective remote learning."
    },
    {
      question: "What are your fees?",
      answer: "Our fees vary depending on the subject, year level, and session type. Please contact us for a personalized quote. We offer competitive rates and package deals for regular sessions."
    },
    {
      question: "How do I book a session?",
      answer: "You can book through our online booking system, call us directly, or fill out our contact form. We offer a free initial consultation to assess your needs."
    },
    {
      question: "What is your cancellation policy?",
      answer: "We require 24 hours notice for cancellations. Same-day cancellations may incur a fee. We're flexible with rescheduling when possible."
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Message Sent Successfully!",
      description: "Thank you for contacting us. We'll respond within 24 hours.",
    });

    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <ModernNavbar />

      {/* Hero Section */}
      <section className="py-32 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto text-center">
          <ScrollReveal direction="up">
            <Badge variant="secondary" className="mb-6">
              Get in Touch
            </Badge>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
              Contact
              <br />
              <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                MBEST
              </span>
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Ready to start your learning journey? Get in touch with our friendly team 
              to discuss your needs and schedule your free consultation.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto">
          <StaggeredReveal staggerDelay={0.1}>
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-card hover:shadow-2xl transition-all h-full group">
                  <CardContent className="p-6 text-center">
                    <motion.div 
                      className="mb-4 flex justify-center"
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {info.icon}
                    </motion.div>
                    <h4 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{info.title}</h4>
                    <p className="text-foreground font-medium mb-1">{info.details}</p>
                    <p className="text-muted-foreground text-sm">{info.subtext}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </StaggeredReveal>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  Send us a Message
                </CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="booking">Booking & Scheduling</SelectItem>
                          <SelectItem value="fees">Fees & Pricing</SelectItem>
                          <SelectItem value="programs">Programs & Services</SelectItem>
                          <SelectItem value="support">Student Support</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Tell us how we can help you..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-gradient-primary text-white"
                  >
                    Send Message
                    <Send className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Map & Additional Info */}
            <div className="space-y-8">
              {/* Map Placeholder */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-success/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
                      <h4 className="text-xl font-semibold text-foreground mb-2">Find Us Here</h4>
                      <p className="text-muted-foreground">123 Education Street, Learning City</p>
                      <Button variant="outline" className="mt-4">
                        Open in Maps
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Details */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {businessDetails.map((detail, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-muted-foreground">{detail.label}:</span>
                      <span className="font-medium text-foreground">{detail.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Follow Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button size="icon" variant="outline" className="hover:bg-primary hover:text-white">
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="hover:bg-primary hover:text-white">
                      <Instagram className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="hover:bg-primary hover:text-white">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about our tutoring services and programs.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {faqItems.map((faq, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-foreground mb-3">{faq.question}</h4>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-primary">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            Ready to Get Started?
          </h3>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Don't wait to begin your journey towards academic success. 
            Contact us today for your free consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/appointments">
              <Button size="lg" variant="secondary">
                Book Free Consultation
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
              <Phone className="mr-2 h-5 w-5" />
              Call Now
            </Button>
          </div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
}
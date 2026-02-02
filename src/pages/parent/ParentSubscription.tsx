import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Upload, Loader2, Users, BookOpen, GraduationCap, CreditCard, LogOut } from "lucide-react";
import { parentApi, type Package, type SubscriptionInfo, type Payment } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/authStore';

const ParentSubscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, logout } = useAuthStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if subscription is active and redirect to dashboard
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const sub = await parentApi.getMySubscription();
        if (sub?.status === 'active' && sub.package) {
          navigate('/parent', { replace: true });
        }
      } catch (err) {
        // Ignore errors - let user stay on subscription page
      }
    };
    checkAndRedirect();
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [packagesData, subscriptionData] = await Promise.all([
        parentApi.getPackages(),
        parentApi.getMySubscription().catch(() => null),
      ]);
      console.log('Loaded packages:', packagesData);
      console.log('Packages count:', packagesData?.length);
      setPackages(packagesData || []);
      setSubscription(subscriptionData);
      
      if (!packagesData || packagesData.length === 0) {
        setError('No subscription packages available. Please contact support.');
      }
    } catch (err: any) {
      console.error('Error loading packages:', err);
      setError(err.message || 'Failed to load subscription data');
      toast({
        title: "Error",
        description: err.message || 'Failed to load subscription data',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setPaymentSlip(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a JPEG, PNG, or PDF file');
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setPaymentSlip(file);
      setError(null);
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedPackage) {
      setError('Please select a package');
      return;
    }
    if (!paymentSlip) {
      setError('Please upload a payment slip');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await parentApi.submitPayment(selectedPackage.id, paymentSlip);
      toast({
        title: "Success",
        description: "Payment submitted successfully. Waiting for admin approval.",
      });
      // Reload subscription data
      await loadData();
      setSelectedPackage(null);
      setPaymentSlip(null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment');
      toast({
        title: "Error",
        description: err.message || 'Failed to submit payment',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/signin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading subscription packages...</p>
        </div>
      </div>
    );
  }

  // If subscription is active, show status with redirect option
  if (subscription?.status === 'active' && subscription.package) {
    return (
      <div className="min-h-screen bg-background">
        {/* Simple Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">MATHEMATICS BEYOND TUTORING</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{session?.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto py-8 px-4">
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Active Subscription
            </CardTitle>
            <CardDescription>Your subscription is active and you can access all features.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">{subscription.package.name}</h3>
              <p className="text-muted-foreground mb-4">{subscription.package.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Students: {subscription.current_student_count} / {subscription.limits?.student_limit || 0}
                  </span>
                </div>
                {subscription.limits?.classes && subscription.limits.classes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Available Classes: {subscription.limits.classes.length}
                    </span>
                  </div>
                )}
              </div>
              {subscription.limits?.classes && subscription.limits.classes.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Included Classes:</p>
                  <div className="flex flex-wrap gap-2">
                    {subscription.limits.classes.map((cls: any) => (
                      <Badge key={cls.id} variant="outline">
                        {cls.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {subscription.status === 'active' && (
              <Button onClick={() => navigate('/parent')}>
                Go to Dashboard
              </Button>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  // Show pending payment status
  if (subscription?.pending_payment) {
    const payment = subscription.pending_payment;
    return (
      <div className="min-h-screen bg-background">
        {/* Simple Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">MATHEMATICS BEYOND TUTORING</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{session?.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto py-8 px-4">
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {payment.status === 'pending' && <Loader2 className="h-5 w-5 animate-spin" />}
              {payment.status === 'approved' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {payment.status === 'rejected' && <XCircle className="h-5 w-5 text-red-500" />}
              Payment Status: {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payment.status === 'pending' && (
              <Alert>
                <AlertDescription>
                  Your payment is pending admin approval. You will be notified once it's approved.
                </AlertDescription>
              </Alert>
            )}
            {payment.status === 'rejected' && payment.admin_notes && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Rejection Reason:</strong> {payment.admin_notes}
                </AlertDescription>
              </Alert>
            )}
            <div>
              <p><strong>Package:</strong> {payment.package?.name}</p>
              <p><strong>Amount:</strong> ${typeof payment.amount === 'string' ? parseFloat(payment.amount).toFixed(2) : payment.amount.toFixed(2)}</p>
              <p><strong>Submitted:</strong> {new Date(payment.created_at).toLocaleDateString()}</p>
            </div>
            {payment.status === 'rejected' && (
              <Button onClick={() => {
                setSelectedPackage(payment.package || null);
                setSubscription(null);
              }}>
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/M.B.E.S.T-logo.png" 
              alt="MBEST Logo" 
              className="h-10 w-auto"
              onError={(e) => {
                // Fallback to text if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <h1 className="text-xl font-bold">MATHEMATICS BEYOND TUTORING</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Select Subscription Package</h1>
          <p className="text-muted-foreground">Choose a package that fits your needs</p>
        </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {packages.length === 0 && !isLoading && (
        <Alert className="mb-6">
          <AlertDescription>
            No subscription packages are currently available. Please contact support for assistance.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`cursor-pointer transition-all ${
              selectedPackage?.id === pkg.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handlePackageSelect(pkg)}
          >
            <CardHeader>
              <CardTitle>{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">${typeof pkg.price === 'string' ? parseFloat(pkg.price).toFixed(2) : pkg.price.toFixed(2)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{pkg.student_limit} Students</span>
                </li>
                {pkg.classes && pkg.classes.length > 0 && (
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 mt-0.5" />
                    <div className="flex-1">
                      <span className="block mb-1">{pkg.classes.length} Classes Included:</span>
                      <div className="flex flex-wrap gap-1">
                        {pkg.classes.slice(0, 3).map((cls: any) => (
                          <Badge key={cls.id} variant="outline" className="text-xs">
                            {cls.name}
                          </Badge>
                        ))}
                        {pkg.classes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{pkg.classes.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </li>
                )}
                {pkg.allows_one_on_one && (
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>1:1 Sessions Available</span>
                  </li>
                )}
              </ul>
              {selectedPackage?.id === pkg.id && (
                <Badge variant="default">Selected</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPackage && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Upload your payment slip to complete the subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{selectedPackage.name}</h3>
              <p className="text-muted-foreground mb-4">
                Amount: ${typeof selectedPackage.price === 'string' ? parseFloat(selectedPackage.price).toFixed(2) : selectedPackage.price.toFixed(2)}
              </p>
            </div>

            {selectedPackage.bank_details && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Bank Details for Payment:</h4>
                <pre className="whitespace-pre-wrap text-sm">{selectedPackage.bank_details}</pre>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="payment-slip">Payment Slip (JPEG, PNG, or PDF - Max 10MB)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="payment-slip"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="max-w-md"
                />
                {paymentSlip && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{paymentSlip.name}</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmitPayment}
              disabled={!paymentSlip || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Payment
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default ParentSubscription;

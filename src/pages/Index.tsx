import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Settings } from "lucide-react";

export default function Index() {
  const portals = [
    {
      title: "Student Portal",
      description: "Access your classes, assignments, and resources",
      icon: <GraduationCap className="h-8 w-8" />,
      href: "/auth/signin",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Tutor Portal", 
      description: "Manage classes, students, and teaching materials",
      icon: <Users className="h-8 w-8" />,
      href: "/auth/signin",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Parent Portal",
      description: "Monitor your child's progress and communication",
      icon: <BookOpen className="h-8 w-8" />,
      href: "/auth/signin", 
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Admin Portal",
      description: "System administration and management tools",
      icon: <Settings className="h-8 w-8" />,
      href: "/auth/signin",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center text-white mb-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-2xl font-bold text-white">MB</span>
          </div>
          <h1 className="mb-4 text-5xl font-bold">MBEST</h1>
          <p className="text-xl text-white/80">Learning Management System</p>
          <p className="text-lg text-white/70 mt-4">
            Choose your portal to get started
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portals.map((portal, index) => (
            <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r ${portal.color} flex items-center justify-center text-white mb-4`}>
                  {portal.icon}
                </div>
                <CardTitle className="text-xl font-bold text-foreground">
                  {portal.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {portal.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-6">
                <Link to={portal.href}>
                  <Button className="w-full bg-gradient-to-r from-primary to-primary-light text-white hover:opacity-90">
                    Access Portal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Link to="/">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              ← Back to MBEST Website
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
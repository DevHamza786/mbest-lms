import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  GraduationCap, 
  Users, 
  Award, 
  BookOpen, 
  Star, 
  ArrowRight
} from "lucide-react"; 
import { Link } from "react-router-dom";
import ChatWidget from "@/components/common/ChatWidget";
import { ModernNavbar } from "@/components/common/ModernNavbar";
import { ModernFooter } from "@/components/common/ModernFooter";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { StaggeredReveal } from "@/components/animations/StaggeredReveal";
import { motion } from "framer-motion";

export default function PublicHome() {
  const services = [
    {
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      title: "One-on-One Tutoring",
      description: "Personalized mathematics tutoring tailored to your child's learning style and pace."
    },
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: "Exam Preparation",
      description: "Comprehensive preparation for school exams, entrance tests, and competitive examinations."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Group Sessions",
      description: "Small group classes that encourage peer learning while maintaining individual attention."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Parent",
      content: "My daughter's math grades improved from C to A+ within 3 months. The personalized approach really works!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Student",
      content: "MBEST helped me conquer my fear of algebra. Now I actually enjoy solving math problems!",
      rating: 5
    },
    {
      name: "Emma Wilson",
      role: "Parent", 
      content: "25 years of experience shows. The tutors understand exactly what students need to succeed.",
      rating: 5
    }
  ];

  const stats = [
    { number: "25+", label: "Years Experience" },
    { number: "500+", label: "Students Helped" },
    { number: "95%", label: "Success Rate" },
    { number: "50+", label: "Expert Tutors" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernNavbar />

      {/* Hero Section */}
      <section className="relative py-32 px-4 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto text-center relative z-10">
          <ScrollReveal direction="up">
            <Badge variant="secondary" className="mb-6">
              Mathematics Beyond Every Step Tutoring
            </Badge>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
              Conquering Challenges,
              <br />
              <span className="bg-gradient-to-r from-primary via-primary-light to-secondary bg-clip-text text-transparent">
                Step by Step
              </span>
            </h2>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              With over 25 years of experience, we provide personalized mathematics tutoring 
              that transforms confusion into confidence and challenges into achievements.
            </p>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/appointments">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity">
                    Book Free Consultation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/services">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="lg" className="hover:bg-primary hover:text-white transition-all">
                    View Programs
                  </Button>
                </motion.div>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-card/50 border-y border-border/50">
        <div className="container mx-auto">
          <ScrollReveal direction="up">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
              {stats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="text-center flex-shrink-0"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2"
                    initial={{ scale: 0.5, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {stat.number}
                  </motion.div>
                  <div className="text-muted-foreground font-medium text-sm md:text-base">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-6">
                  About M.B.E.S.T Tutoring Centre
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  For over 25 years, MBEST has been dedicated to helping students overcome 
                  mathematical challenges and achieve academic excellence. Our proven methodology 
                  focuses on building strong foundations while developing problem-solving confidence.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Award, text: "Proven track record with 95% success rate" },
                    { icon: Users, text: "Personalized learning approach" },
                    { icon: BookOpen, text: "Comprehensive curriculum coverage" }
                  ].map((item, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-center gap-3 group"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <item.icon className="h-5 w-5 text-success group-hover:scale-110 transition-transform" />
                      <span className="group-hover:text-foreground transition-colors">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal direction="right">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="aspect-square bg-gradient-to-br from-primary/20 via-primary/10 to-success/20 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                  <GraduationCap className="h-32 w-32 text-primary" />
                </div>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-foreground mb-4">Our Services</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comprehensive mathematics education tailored to every student's needs and learning style.
              </p>
            </div>
          </ScrollReveal>
          
          <StaggeredReveal staggerDelay={0.15}>
            {services.map((service, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-card hover:shadow-2xl transition-all h-full group">
                  <CardContent className="p-8 text-center">
                    <motion.div 
                      className="mb-6 flex justify-center"
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                    >
                      {service.icon}
                    </motion.div>
                    <h4 className="text-xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">{service.title}</h4>
                    <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </StaggeredReveal>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-foreground mb-4">What Our Families Say</h3>
              <p className="text-muted-foreground">
                Real stories from students and parents who've experienced the MBEST difference.
              </p>
            </div>
          </ScrollReveal>
          
          <StaggeredReveal staggerDelay={0.15}>
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-card hover:shadow-xl transition-all h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Star className="h-5 w-5 fill-warning text-warning" />
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic leading-relaxed">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </StaggeredReveal>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 bg-gradient-primary relative overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <ScrollReveal direction="up">
            <h3 className="text-3xl font-bold text-white mb-4">
              Stay Updated with MBEST
            </h3>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Get the latest math tips, study resources, and updates on our programs 
              delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Input 
                placeholder="Enter your email" 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="secondary" className="hover:bg-white transition-colors">
                  Subscribe
                </Button>
              </motion.div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <ModernFooter />
      
      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
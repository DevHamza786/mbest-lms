import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Users, 
  Award, 
  BookOpen, 
  Target,
  Heart,
  Brain,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { ModernNavbar } from "@/components/common/ModernNavbar";
import { ModernFooter } from "@/components/common/ModernFooter";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { StaggeredReveal } from "@/components/animations/StaggeredReveal";
import { motion } from "framer-motion";

export default function About() {
  const researchMethods = [
    {
      researcher: "John Hattie",
      method: "Visible Learning",
      description: "Evidence-based teaching strategies that maximize student learning outcomes through feedback and assessment.",
      icon: <TrendingUp className="h-6 w-6 text-primary" />
    },
    {
      researcher: "Barak Rosenshine",
      method: "Principles of Instruction",
      description: "Systematic approach to instruction including modeling, guided practice, and independent learning.",
      icon: <BookOpen className="h-6 w-6 text-primary" />
    },
    {
      researcher: "Carol Dweck",
      method: "Growth Mindset",
      description: "Fostering belief that abilities can be developed through dedication, hard work, and learning from failure.",
      icon: <Brain className="h-6 w-6 text-primary" />
    }
  ];

  const differentiators = [
    {
      title: "Research-Backed Methods",
      description: "Our teaching approaches are grounded in the latest educational research and proven methodologies.",
      icon: <Award className="h-8 w-8 text-success" />
    },
    {
      title: "Psychology Integration",
      description: "We combine behavior therapy and educational psychology to address both academic and emotional needs.",
      icon: <Heart className="h-8 w-8 text-success" />
    },
    {
      title: "Personalised Daily Plans",
      description: "Each student receives a customized learning plan tailored to their unique needs and learning style.",
      icon: <Target className="h-8 w-8 text-success" />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernNavbar />

      {/* Hero Section */}
      <section className="py-32 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto text-center">
          <ScrollReveal direction="up">
            <Badge variant="secondary" className="mb-6">
              Our Story & Philosophy
            </Badge>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
              About
              <br />
              <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                M.B.E.S.T
              </span>
            </h2>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Mathematics Beyond Every Step Tutoring - transforming educational challenges 
              into stepping stones for success, one student at a time.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-6">
                  Our Story
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  For over 25 years, MBEST has been at the forefront of educational excellence, 
                  founded on the belief that every student has the potential to succeed when given 
                  the right support, methodology, and encouragement.
                </p>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  What started as a small tutoring initiative has grown into a comprehensive 
                  educational center that combines traditional teaching excellence with modern 
                  psychological insights and research-backed methodologies.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Users, text: "500+ students successfully guided" },
                    { icon: Award, text: "95% improvement in academic performance" },
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
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-success/20 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                  <GraduationCap className="h-32 w-32 text-primary" />
                </div>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <ScrollReveal direction="up">
            <h3 className="text-3xl font-bold text-foreground mb-4">Our Mission</h3>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              To provide transformational education that goes beyond traditional tutoring, 
              fostering not just academic excellence but also confidence, resilience, and 
              a lifelong love for learning.
            </p>
          </ScrollReveal>
          
          <ScrollReveal direction="scale" delay={0.2}>
            <motion.div 
              className="bg-gradient-primary rounded-2xl p-8 text-white"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="text-2xl font-bold mb-4">
                "Transformation Step by Step, Beyond Every Step"
              </h4>
              <p className="text-white/90 max-w-2xl mx-auto">
                We believe that every challenge is an opportunity for growth, and every step forward, 
                no matter how small, is a victory worth celebrating.
              </p>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* Research-Backed Methods */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-foreground mb-4">Research-Backed Methodology</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our teaching methods are grounded in the latest educational research from leading experts in the field.
              </p>
            </div>
          </ScrollReveal>
          
          <StaggeredReveal staggerDelay={0.15}>
            {researchMethods.map((method, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-card hover:shadow-2xl transition-all h-full group">
                  <CardContent className="p-8">
                    <motion.div 
                      className="mb-6 flex justify-center"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {method.icon}
                    </motion.div>
                    <h4 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{method.researcher}</h4>
                    <h5 className="text-lg font-medium text-primary mb-4">{method.method}</h5>
                    <p className="text-muted-foreground leading-relaxed">{method.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </StaggeredReveal>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-foreground mb-4">What Sets Us Apart</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our unique approach combines academic excellence with psychological well-being and personalized learning.
              </p>
            </div>
          </ScrollReveal>
          
          <StaggeredReveal staggerDelay={0.15}>
            {differentiators.map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-card hover:shadow-2xl transition-all h-full group">
                  <CardContent className="p-8 text-center">
                    <motion.div 
                      className="mb-6 flex justify-center"
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {item.icon}
                    </motion.div>
                    <h4 className="text-xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </StaggeredReveal>
        </div>
      </section>

      {/* Personal Story Example */}
      <section className="py-16 px-4 bg-gradient-primary">
        <div className="container mx-auto text-center">
          <ScrollReveal direction="up">
            <h3 className="text-3xl font-bold text-white mb-8">
              A Real Success Story
            </h3>
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto border border-white/20"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-white/90 text-lg leading-relaxed mb-6">
                "When Sarah first came to us, she was struggling with Year 10 mathematics and had developed 
                a fear of numbers. Through our personalized daily plans, combining cognitive behavioral techniques 
                with structured learning, we not only helped her master algebraic concepts but also rebuilt her 
                confidence. Today, she's pursuing advanced mathematics and dreams of becoming an engineer."
              </p>
              <p className="text-white font-medium">- Real MBEST Success Story</p>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <ScrollReveal direction="up">
            <h3 className="text-3xl font-bold text-foreground mb-6">
              Ready to Begin Your Journey?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of students who have transformed their academic journey with MBEST. 
              Every step forward is a step towards your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/appointments">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity">
                    Book Free Consultation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/contact">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="lg" className="hover:bg-primary hover:text-white transition-all">
                    Contact Us
                  </Button>
                </motion.div>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
}
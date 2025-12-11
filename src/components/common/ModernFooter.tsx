import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Facebook, 
  Instagram, 
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  ArrowUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

export function ModernFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Resources', href: '/resources' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
    { name: 'Book Trial', href: '/appointments' }
  ];

  const services = [
    'Mathematics Tutoring',
    'English Support',
    'Science Coaching',
    'OC Test Prep',
    'HSC Preparation',
    'Selective School Prep'
  ];

  return (
    <footer className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-t border-border/50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <ScrollReveal direction="up" delay={0.1}>
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-3 group">
                <motion.div 
                  className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <GraduationCap className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">MBEST</h3>
                  <p className="text-sm text-muted-foreground">Tutoring Centre</p>
                </div>
              </Link>
              
              <p className="text-muted-foreground leading-relaxed">
                Conquering mathematical challenges, step by step, for over 25 years. 
                Transforming education through research-backed methods and personalized learning.
              </p>
              
              <div className="flex gap-3">
                <motion.a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary/10 hover:bg-primary hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Facebook className="h-4 w-4" />
                </motion.a>
                <motion.a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary/10 hover:bg-primary hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Instagram className="h-4 w-4" />
                </motion.a>
                <motion.a 
                  href="https://wa.me/1234567890" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-success/10 hover:bg-success hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageCircle className="h-4 w-4" />
                </motion.a>
              </div>
            </div>
          </ScrollReveal>

          {/* Quick Links */}
          <ScrollReveal direction="up" delay={0.2}>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">Quick Links</h4>
              <nav className="flex flex-col gap-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>
          </ScrollReveal>

          {/* Services */}
          <ScrollReveal direction="up" delay={0.3}>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">Our Services</h4>
              <ul className="flex flex-col gap-2">
                {services.map((service) => (
                  <li
                    key={service}
                    className="text-muted-foreground text-sm"
                  >
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Contact & Newsletter */}
          <ScrollReveal direction="up" delay={0.4}>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">Stay Connected</h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  info@mbest.edu.au
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  +61 2 1234 5678
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  Auckland, New Zealand
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Subscribe to our newsletter for updates and learning tips.
                </p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter your email" 
                    className="text-sm"
                  />
                  <Button 
                    size="sm"
                    className="bg-gradient-primary hover:opacity-90 transition-opacity shrink-0"
                  >
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom Section */}
        <ScrollReveal direction="up" delay={0.5}>
          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              &copy; 2024 MBEST Tutoring Centre. All rights reserved. 
              <span className="block md:inline md:ml-2">
                Transforming education, step by step.
              </span>
            </p>
            
            <motion.button
              onClick={scrollToTop}
              className="w-10 h-10 bg-primary/10 hover:bg-primary hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowUp className="h-4 w-4" />
            </motion.button>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
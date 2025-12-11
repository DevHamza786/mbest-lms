import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Download, 
  AlertCircle,
  Award,
  Target
} from 'lucide-react';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useParentContext, useParentStore } from '@/lib/store/parentStore';
import { parentService } from '@/lib/mocks/parent';
import { useToast } from '@/hooks/use-toast';

export default function ParentGrades() {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { toast } = useToast();
  
  const {
    activeChild,
    grades,
    isLoading,
  } = useParentContext();

  const {
    setGrades,
    setLoading,
  } = useParentStore();

  // Load grades when active child changes
  useEffect(() => {
    if (!activeChild?.id) return;

    const loadGrades = async () => {
      try {
        setLoading(true);
        const gradesData = await parentService.getGradesForChild(activeChild.id);
        setGrades(gradesData);
      } catch (error) {
        console.error('Failed to load grades:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGrades();
  }, [activeChild?.id, setGrades, setLoading]);

  // Get unique subjects and categories for filters
  const subjects = [...new Set(grades?.map(g => g.subject) || [])];
  const categories = [...new Set(grades?.map(g => g.category) || [])];

  // Filter grades based on search and filters
  const filteredGrades = grades?.filter((grade) => {
    const matchesSearch = grade.assessment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || grade.subject === subjectFilter;
    const matchesCategory = categoryFilter === 'all' || grade.category === categoryFilter;
    return matchesSearch && matchesSubject && matchesCategory;
  }) || [];

  // Calculate statistics
  const calculateSubjectStats = () => {
    if (!grades?.length) return [];
    
    const subjectStats = subjects.map(subject => {
      const subjectGrades = grades.filter(g => g.subject === subject);
      const average = subjectGrades.reduce((sum, g) => sum + g.grade, 0) / subjectGrades.length;
      const highest = Math.max(...subjectGrades.map(g => g.grade));
      const lowest = Math.min(...subjectGrades.map(g => g.grade));
      
      return {
        subject,
        average: Math.round(average),
        highest,
        lowest,
        count: subjectGrades.length
      };
    });
    
    return subjectStats.sort((a, b) => b.average - a.average);
  };

  const overallAverage = grades?.length 
    ? Math.round(grades.reduce((sum, g) => sum + g.grade, 0) / grades.length)
    : 0;

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBadgeVariant = (grade: number) => {
    if (grade >= 90) return 'default';
    if (grade >= 80) return 'secondary';
    if (grade >= 70) return 'outline';
    return 'destructive';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExportPDF = () => {
    toast({
      title: "Export Started",
      description: "Grade report is being generated and will download shortly.",
    });
    // In a real app, this would trigger PDF generation
  };

  const subjectStats = calculateSubjectStats();

  if (!activeChild) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Child Selected</h2>
            <p className="text-muted-foreground">Please select a child to view their grades.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Grades</h1>
          <p className="text-muted-foreground">
            {activeChild.name}'s academic performance overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ChildSwitcher />
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Overall Performance */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGradeColor(overallAverage)}`}>
              {overallAverage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {grades?.length || 0} assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {grades?.length ? Math.max(...grades.map(g => g.grade)) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Best performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Above 90%</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {grades?.filter(g => g.grade >= 90).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Excellent grades</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      {subjectStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Average grades by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectStats.map((stat) => (
                <div key={stat.subject} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{stat.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${getGradeColor(stat.average)}`}>
                        {stat.average}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({stat.count} assessment{stat.count !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                  <Progress value={stat.average} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Lowest: {stat.lowest}%</span>
                    <span>Highest: {stat.highest}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assessments or subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grades Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading grades...</p>
          </div>
        </div>
      ) : filteredGrades.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Grade Details</CardTitle>
            <CardDescription>
              {filteredGrades.length} assessment{filteredGrades.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">{grade.assessment}</TableCell>
                    <TableCell>{grade.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{grade.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getGradeBadgeVariant(grade.grade)}>
                          {grade.grade}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          / {grade.maxGrade}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(grade.date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Grades Found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || subjectFilter !== 'all' || categoryFilter !== 'all'
                ? 'No grades match your current filters.' 
                : `${activeChild.name} has no grades recorded yet.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* View-only Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">
              <strong>View-only access:</strong> You can view grades but cannot make changes. 
              Contact your child's teachers for questions about specific assessments.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Search } from "lucide-react";
import Navbar from "@/components/Navbar";

const StudentDashboard = () => {
  const [studentName, setStudentName] = useState<string>("");
  //using the session info
  useEffect(() => {
    const storedStudent = localStorage.getItem("student");
    if (storedStudent) {
      const studentData = JSON.parse(storedStudent);
      setStudentName(`${studentData.first_name} ${studentData.last_name}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-black mb-8 bg-gradient-accent bg-clip-text text-transparent">
          Hello, {studentName || "Student"}
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Browse All Events */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Browse All Events</CardTitle>
              </div>
              <CardDescription>
                Discover upcoming events and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No events available at the moment
              </p>
            </CardContent>
          </Card>

          {/* Registered Events */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Registered Events</CardTitle>
              </div>
              <CardDescription>
                Events you've signed up for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You haven't registered for any events yet
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;

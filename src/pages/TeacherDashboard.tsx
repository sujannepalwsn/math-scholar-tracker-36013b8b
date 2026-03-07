import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Home, BookOpen, CheckSquare, Users, CalendarDays, MessageSquare, Bell, Clock, AlertTriangle, Video } from 'lucide-react';
import { format, isToday, isFuture, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
  const { user } = useAuth();

  // Fetch upcoming center events
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['teacher-upcoming-events', user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('center_events')
        .select('*')
        .eq('center_id', user.center_id)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  // Today's events
  const todaysEvents = upcomingEvents.filter((e: any) => isToday(new Date(e.event_date)));

  // Fetch teacher's upcoming meetings
  const { data: upcomingMeetings = [] } = useQuery({
    queryKey: ['teacher-upcoming-meetings', user?.teacher_id, user?.id],
    queryFn: async () => {
      if (!user?.teacher_id && !user?.id) return [];
      
      let { data, error } = await supabase
        .from('meeting_attendees')
        .select(`
          *,
          meetings(id, title, meeting_date, meeting_type, status, location, agenda)
        `)
        .eq('teacher_id', user.teacher_id!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const upcomingOnly = (data || []).filter((att: any) => {
        if (!att.meetings?.meeting_date) return false;
        const meetingDate = new Date(att.meetings.meeting_date);
        return isFuture(meetingDate) || isToday(meetingDate);
      });
      
      return upcomingOnly.slice(0, 5);
    },
    enabled: !!user?.teacher_id || !!user?.id,
  });

  // Today's meetings
  const todaysMeetings = upcomingMeetings.filter((att: any) => 
    att.meetings?.meeting_date && isToday(new Date(att.meetings.meeting_date))
  );

  // Unread messages count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['teacher-unread-messages-dashboard', user?.id, user?.center_id],
    queryFn: async () => {
      if (!user?.id || !user?.center_id) return 0;
      const { data: conversation } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('parent_user_id', user.id)
        .eq('center_id', user.center_id)
        .maybeSingle();
      if (!conversation) return 0;
      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', conversation.id)
        .eq('is_read', false)
        .neq('sender_user_id', user.id);
      return count || 0;
    },
    enabled: !!user?.id && !!user?.center_id,
  });

  // Recent broadcast messages
  const { data: recentBroadcasts = [] } = useQuery({
    queryKey: ['teacher-broadcasts', user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .eq('center_id', user.center_id)
        .in('target_audience', ['all_teachers', `teacher_${user.teacher_id}`])
        .order('sent_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  const StatCard = ({ title, value, icon: Icon, description, colorClass, bgColor, link }: any) => (
    <Card
      onClick={() => link && navigate(link)}
      className={cn(
        "group relative border-none shadow-strong overflow-hidden transition-all duration-500 rounded-[2rem] bg-white/40 backdrop-blur-md border border-white/20",
        link && "cursor-pointer hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
      )}
    >
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-transparent")} />
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{title}</p>
            <h3 className="text-3xl font-black tracking-tighter group-hover:text-primary transition-colors duration-300">{value}</h3>
            {description && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-70">{description}</p>}
          </div>
          <div className={cn("p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-soft", bgColor)}>
            <Icon className={cn("h-6 w-6 text-primary")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-primary to-violet-600 uppercase">
            Instructor Console
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-[0.2em] opacity-70">
              Welcome, Agent {user?.username?.split('@')[0].toUpperCase() || 'FACULTY'}
            </p>
          </div>
        </div>
        <div className="bg-white/40 backdrop-blur-md px-6 py-3 rounded-[2rem] border border-white/40 shadow-soft flex items-center gap-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground leading-none">Temporal Marker</span>
            <span className="font-black text-slate-700 text-sm">{format(new Date(), 'EEEE, MMMM d')}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Daily Assemblies"
          value={todaysMeetings.length}
          icon={Video}
          bgColor="bg-blue-500/10"
          description="sessions today"
          link="/teacher/meetings"
        />
        <StatCard
          title="Calendar Events"
          value={todaysEvents.length}
          icon={CalendarDays}
          bgColor="bg-green-500/10"
          description={todaysEvents.some((e: any) => e.is_holiday) ? 'Institutional Holiday' : 'active events'}
          link="/teacher/calendar"
        />
        <StatCard
          title="Neural Comms"
          value={unreadCount}
          icon={MessageSquare}
          bgColor="bg-purple-500/10"
          description="unread signals"
          link="/teacher/messaging"
        />
        <StatCard
          title="Upcoming Queue"
          value={upcomingMeetings.length}
          icon={Bell}
          bgColor="bg-orange-500/10"
          description="pending sessions"
          link="/teacher/meetings"
        />
      </div>

      {/* Feature Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: "Roll Call",
            icon: CheckSquare,
            color: "text-indigo-600",
            bgColor: "bg-indigo-500/10",
            desc: "Verify daily student presence.",
            perm: user?.teacherPermissions?.take_attendance,
            link: "/teacher/take-attendance"
          },
          {
            title: "Syllabus Pulse",
            icon: BookOpen,
            color: "text-emerald-600",
            bgColor: "bg-emerald-500/10",
            desc: "Update instructional milestones.",
            perm: user?.teacherPermissions?.lesson_tracking,
            link: "/teacher/lesson-tracking"
          },
          {
            title: "Analytics Hub",
            icon: Users,
            color: "text-violet-600",
            bgColor: "bg-violet-500/10",
            desc: "Deep-dive into student performance.",
            perm: user?.teacherPermissions?.student_report_access,
            link: "/teacher/student-report"
          }
        ].filter(f => f.perm).map((feature) => (
          <Card
            key={feature.title}
            className="group cursor-pointer border-none shadow-strong rounded-[2.5rem] bg-white/40 backdrop-blur-md border border-white/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
            onClick={() => navigate(feature.link)}
          >
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className={cn("p-5 rounded-[2rem] shadow-soft transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", feature.bgColor)}>
                  <feature.icon className={cn("h-10 w-10", feature.color)} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-xl text-slate-800 tracking-tight uppercase">{feature.title}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{feature.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Meetings Detail */}
      {todaysMeetings.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" /> Today's Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysMeetings.map((attendee: any) => (
                <div key={attendee.id} className="p-3 rounded-lg border bg-background">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{attendee.meetings?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {attendee.meetings?.meeting_type?.charAt(0).toUpperCase() + attendee.meetings?.meeting_type?.slice(1)} Meeting
                        {attendee.meetings?.location && ` • ${attendee.meetings.location}`}
                      </p>
                      {attendee.meetings?.agenda && (
                        <p className="text-xs text-muted-foreground mt-1">Agenda: {attendee.meetings.agenda}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{format(new Date(attendee.meetings?.meeting_date), 'p')}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Broadcasts */}
      {recentBroadcasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBroadcasts.map((msg: any) => (
                <div key={msg.id} className="p-3 rounded-lg border bg-muted/50">
                  <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(msg.sent_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No upcoming events.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event: any) => (
                <div key={event.id} className={`p-3 rounded-lg border ${event.is_holiday ? 'bg-red-50 border-red-200' : 'bg-muted/50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{format(new Date(event.event_date), 'PPP')}</p>
                      {event.is_holiday && <span className="text-xs text-red-600 font-medium">Holiday</span>}
                      {isToday(new Date(event.event_date)) && <Badge className="ml-2">Today</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Meetings */}
      {user?.teacherPermissions?.meetings_management && upcomingMeetings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" /> Upcoming Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMeetings.map((attendee: any) => (
                <div key={attendee.id} className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{attendee.meetings?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {attendee.meetings?.meeting_type?.charAt(0).toUpperCase() + attendee.meetings?.meeting_type?.slice(1)} Meeting
                        {attendee.meetings?.location && ` • ${attendee.meetings.location}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{format(new Date(attendee.meetings?.meeting_date), 'PPP')}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(attendee.meetings?.meeting_date), 'p')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

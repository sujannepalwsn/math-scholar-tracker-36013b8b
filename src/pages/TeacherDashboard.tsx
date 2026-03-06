import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Home, BookOpen, CheckSquare, Users, CalendarDays, MessageSquare, Bell, Clock, AlertTriangle, Video } from 'lucide-react';
import { format, isToday, isFuture, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";

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

  const StatCard = ({ title, value, icon: Icon, description, colorClass, bgColor }: any) => (
    <Card
      className="group relative border-none shadow-soft overflow-hidden transition-all duration-500 hover:shadow-strong hover:-translate-y-1 active:scale-[0.98]"
    >
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-transparent")} />
      <CardContent className="p-4 md:p-6 relative z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-1 md:space-y-2">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground/70">{title}</p>
            <h3 className="text-xl md:text-3xl font-black tracking-tight group-hover:text-primary transition-colors duration-300">{value}</h3>
            {description && <p className="text-[8px] md:text-[10px] font-medium text-muted-foreground italic line-clamp-1">{description}</p>}
          </div>
          <div className={cn("p-2 md:p-3 rounded-lg md:rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3", bgColor)}>
            <Icon className={cn("h-4 w-4 md:h-6 md:w-6 text-primary")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
            Teacher Hub
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-muted-foreground text-sm font-medium">Welcome back, {user?.username}! Planning your day.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 text-primary">
            <Clock className="h-4 w-4" />
            {format(new Date(), 'EEEE, MMMM d')}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Today's Meetings"
          value={todaysMeetings.length}
          icon={Video}
          bgColor="bg-blue-500/10"
          description="scheduled for today"
        />
        <StatCard
          title="Today's Events"
          value={todaysEvents.length}
          icon={CalendarDays}
          bgColor="bg-green-500/10"
          description={todaysEvents.some((e: any) => e.is_holiday) ? '🏖️ Holiday today!' : 'happening today'}
        />
        <StatCard
          title="Unread Messages"
          value={unreadCount}
          icon={MessageSquare}
          bgColor="bg-purple-500/10"
          description="awaiting response"
        />
        <StatCard
          title="Upcoming"
          value={upcomingMeetings.length}
          icon={Bell}
          bgColor="bg-orange-500/10"
          description="scheduled ahead"
        />
      </div>

      {/* Feature Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Take Attendance",
            icon: CheckSquare,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            desc: "Mark student presence for your classes.",
            perm: user?.teacherPermissions?.take_attendance,
            link: "/teacher/take-attendance"
          },
          {
            title: "Lesson Tracking",
            icon: BookOpen,
            color: "text-green-600",
            bgColor: "bg-green-50",
            desc: "Record lessons taught and student progress.",
            perm: user?.teacherPermissions?.lesson_tracking,
            link: "/teacher/lesson-tracking"
          },
          {
            title: "Student Reports",
            icon: Users,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            desc: "View in-depth performance analytics.",
            perm: user?.teacherPermissions?.student_report_access,
            link: "/teacher/student-report"
          }
        ].filter(f => f.perm).map((feature) => (
          <Card
            key={feature.title}
            className="group cursor-pointer border-none shadow-soft hover:shadow-strong transition-all duration-300"
            onClick={() => window.location.href = feature.link}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl transition-all duration-300 group-hover:scale-110", feature.bgColor)}>
                  <feature.icon className={cn("h-6 w-6", feature.color)} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground font-medium">{feature.desc}</p>
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

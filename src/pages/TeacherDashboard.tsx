import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Home, BookOpen, CheckSquare, Users, CalendarDays, MessageSquare, Bell, Clock, AlertTriangle, Video } from 'lucide-react';
import { format, isToday, isFuture, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
      </div>

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.username}!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Here's your overview for today, {format(new Date(), 'EEEE, MMMM d, yyyy')}.
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Meetings</CardTitle>
            <Video className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysMeetings.length}</div>
            <p className="text-xs text-muted-foreground">scheduled for today</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              {todaysEvents.some((e: any) => e.is_holiday) ? '🏖️ Holiday today!' : 'happening today'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">awaiting response</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
            <Bell className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
            <p className="text-xs text-muted-foreground">scheduled ahead</p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Access Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user?.teacherPermissions?.take_attendance && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Take Attendance</CardTitle>
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Mark student presence.</p>
                </CardContent>
              </Card>
            )}
            {user?.teacherPermissions?.lesson_tracking && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lesson Tracking</CardTitle>
                  <BookOpen className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Record lessons taught.</p>
                </CardContent>
              </Card>
            )}
            {user?.teacherPermissions?.student_report_access && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Student Reports</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">View student performance reports.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

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

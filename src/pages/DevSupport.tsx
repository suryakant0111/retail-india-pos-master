import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function DevSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [response, setResponse] = useState({});
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);

  // Allow multiple admin emails
  const adminEmails = ['suryakantvkhevji@gmail.com', 'ab@gmail.com'];
  console.log('Current user:', user);
  const isAdmin = user && adminEmails.includes(user.email);
  if (!isAdmin) return <div>Access Denied</div>;

  useEffect(() => {
    const fetchTickets = async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      setTickets(data || []);
    };
    fetchTickets();
  }, []);

  const handleRespond = async (id) => {
    setLoading(true);
    await supabase
      .from('support_tickets')
      .update({
        response: response[id],
        status: status[id] || 'resolved',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    setLoading(false);
    // Refresh tickets
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    setTickets(data || []);
  };

  return (
    <div>
      <h1>All Support Tickets</h1>
      <ul>
        {tickets.map(ticket => (
          <li key={ticket.id} style={{border: '1px solid #ccc', margin: 8, padding: 8}}>
            <b>{ticket.subject}</b> - {ticket.status}<br/>
            <i>From user: {ticket.user_id}</i><br/>
            {ticket.message}<br/>
            <div>
              <textarea
                placeholder="Response"
                value={response[ticket.id] || ''}
                onChange={e => setResponse(r => ({...r, [ticket.id]: e.target.value}))}
              />
              <select
                value={status[ticket.id] || ticket.status}
                onChange={e => setStatus(s => ({...s, [ticket.id]: e.target.value}))}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button onClick={() => handleRespond(ticket.id)} disabled={loading}>Send Response</button>
            </div>
            <div>
              <b>Previous Response:</b> {ticket.response || 'No response yet'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
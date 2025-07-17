import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function Support() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's tickets
  useEffect(() => {
    if (!user) return;
    const fetchTickets = async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTickets(data || []);
    };
    fetchTickets();
  }, [user]);

  // Submit new ticket
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!user) return;
    await supabase.from('support_tickets').insert([
      { user_id: user.id, subject, message }
    ]);
    setSubject('');
    setMessage('');
    setLoading(false);
    // Refresh tickets
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTickets(data || []);
  };

  return (
    <div>
      <h1>Support</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Subject"
          required
        />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Describe your issue or feedback"
          required
        />
        <button type="submit" disabled={loading}>Submit</button>
      </form>
      <h2>Your Tickets</h2>
      <ul>
        {tickets.map(ticket => (
          <li key={ticket.id}>
            <b>{ticket.subject}</b> - {ticket.status}<br/>
            {ticket.message}<br/>
            <i>Response: {ticket.response || 'No response yet'}</i>
          </li>
        ))}
      </ul>
    </div>
  );
}
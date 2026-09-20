import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PartnerClient {
  id: string;
  name: string;
  ghl_subaccount_id: string;
  forwarding_number: string;
  region: string;
  active: boolean;
  priority_weight: number;
  last_assigned_at: string | null;
  assigned_count: number;
  created_at: string;
}

interface Assignment {
  id: string;
  partner_client_id: string | null;
  call_id: string;
  region: string;
  reason: string;
  created_at: string;
}

const emptyDraft = {
  name: '',
  forwarding_number: '',
  ghl_subaccount_id: '',
  region: '',
};

export default function AdminPartners() {
  const [clients, setClients] = useState<PartnerClient[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [clientsRes, assignmentsRes] = await Promise.all([
        supabase
          .from('partner_clients')
          .select('*')
          .order('last_assigned_at', { ascending: true, nullsFirst: true }),
        supabase
          .from('partner_call_assignments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);
      if (clientsRes.error) throw clientsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      setClients(clientsRes.data ?? []);
      setAssignments(assignmentsRes.data ?? []);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function addClient() {
    if (!draft.name.trim() || !draft.forwarding_number.trim()) return;
    setSaving(true);
    try {
      const { error: insertError } = await supabase
        .from('partner_clients')
        .insert({
          name: draft.name.trim(),
          forwarding_number: draft.forwarding_number.trim(),
          ghl_subaccount_id: draft.ghl_subaccount_id.trim(),
          region: draft.region.trim(),
        });
      if (insertError) throw insertError;
      setDraft(emptyDraft);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function updateClient(id: string, patch: Partial<PartnerClient>) {
    const { error: updateError } = await supabase
      .from('partner_clients')
      .update(patch)
      .eq('id', id);
    if (updateError) setError(updateError.message);
    else await load();
  }

  async function removeClient(id: string) {
    if (!confirm('Remove this partner? They will stop receiving routed calls.')) return;
    const { error: deleteError } = await supabase.from('partner_clients').delete().eq('id', id);
    if (deleteError) setError(deleteError.message);
    else await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#0D1B2A' }}>
            Partner network
          </h2>
          <p className="text-sm mt-1" style={{ color: '#5A6573' }}>
            Clients the AI caller can round-robin transfers to.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: '#E0DAD0', color: '#0D1B2A', backgroundColor: 'white' }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ backgroundColor: '#FBEEEE', color: '#8A2A2A' }}
        >
          {error}
        </div>
      )}

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#0D1B2A' }}>
          Add partner
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="px-3 py-2 rounded border text-sm"
            style={{ borderColor: '#E0DAD0' }}
            placeholder="Name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <input
            className="px-3 py-2 rounded border text-sm"
            style={{ borderColor: '#E0DAD0' }}
            placeholder="Forwarding number (+1...)"
            value={draft.forwarding_number}
            onChange={(e) => setDraft({ ...draft, forwarding_number: e.target.value })}
          />
          <input
            className="px-3 py-2 rounded border text-sm"
            style={{ borderColor: '#E0DAD0' }}
            placeholder="Region (optional)"
            value={draft.region}
            onChange={(e) => setDraft({ ...draft, region: e.target.value })}
          />
          <input
            className="px-3 py-2 rounded border text-sm"
            style={{ borderColor: '#E0DAD0' }}
            placeholder="GHL Sub-account ID"
            value={draft.ghl_subaccount_id}
            onChange={(e) => setDraft({ ...draft, ghl_subaccount_id: e.target.value })}
          />
        </div>
        <button
          onClick={addClient}
          disabled={saving || !draft.name.trim() || !draft.forwarding_number.trim()}
          className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
          style={{ backgroundColor: '#0D1B2A', color: 'white' }}
        >
          <Plus size={14} />
          Add partner
        </button>
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: '#F0EDE8' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#0D1B2A' }}>
            Partners ({clients.length})
          </h3>
        </div>
        {loading ? (
          <div className="p-6 text-sm" style={{ color: '#5A6573' }}>Loading…</div>
        ) : clients.length === 0 ? (
          <div className="p-6 text-sm" style={{ color: '#5A6573' }}>No partners yet.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#F0EDE8' }}>
            {clients.map((c) => (
              <PartnerRow
                key={c.id}
                client={c}
                onSave={(patch) => updateClient(c.id, patch)}
                onRemove={() => removeClient(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: '#E0DAD0', backgroundColor: 'white' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: '#F0EDE8' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#0D1B2A' }}>
            Recent routed calls ({assignments.length})
          </h3>
        </div>
        {assignments.length === 0 ? (
          <div className="p-6 text-sm" style={{ color: '#5A6573' }}>
            No calls have been routed yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#F7F4EE', color: '#5A6573' }}>
              <tr>
                <th className="text-left px-4 py-2 font-medium">When</th>
                <th className="text-left px-4 py-2 font-medium">Partner</th>
                <th className="text-left px-4 py-2 font-medium">Region</th>
                <th className="text-left px-4 py-2 font-medium">Reason</th>
                <th className="text-left px-4 py-2 font-medium">Call ID</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const client = clients.find((c) => c.id === a.partner_client_id);
                return (
                  <tr key={a.id} className="border-t" style={{ borderColor: '#F0EDE8' }}>
                    <td className="px-4 py-2" style={{ color: '#0D1B2A' }}>
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2" style={{ color: '#0D1B2A' }}>
                      {client?.name || '(deleted)'}
                    </td>
                    <td className="px-4 py-2" style={{ color: '#0D1B2A' }}>
                      {a.region || '—'}
                    </td>
                    <td className="px-4 py-2" style={{ color: '#0D1B2A' }}>
                      {a.reason}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs" style={{ color: '#5A6573' }}>
                      {a.call_id || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PartnerRow({
  client,
  onSave,
  onRemove,
}: {
  client: PartnerClient;
  onSave: (patch: Partial<PartnerClient>) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState({
    name: client.name,
    forwarding_number: client.forwarding_number,
    region: client.region,
    ghl_subaccount_id: client.ghl_subaccount_id,
    active: client.active,
    priority_weight: client.priority_weight,
  });

  const dirty =
    draft.name !== client.name ||
    draft.forwarding_number !== client.forwarding_number ||
    draft.region !== client.region ||
    draft.ghl_subaccount_id !== client.ghl_subaccount_id ||
    draft.active !== client.active ||
    draft.priority_weight !== client.priority_weight;

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          className="px-3 py-2 rounded border text-sm"
          style={{ borderColor: '#E0DAD0' }}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Name"
        />
        <input
          className="px-3 py-2 rounded border text-sm"
          style={{ borderColor: '#E0DAD0' }}
          value={draft.forwarding_number}
          onChange={(e) => setDraft({ ...draft, forwarding_number: e.target.value })}
          placeholder="Number"
        />
        <input
          className="px-3 py-2 rounded border text-sm"
          style={{ borderColor: '#E0DAD0' }}
          value={draft.region}
          onChange={(e) => setDraft({ ...draft, region: e.target.value })}
          placeholder="Region"
        />
        <input
          className="px-3 py-2 rounded border text-sm"
          style={{ borderColor: '#E0DAD0' }}
          value={draft.ghl_subaccount_id}
          onChange={(e) => setDraft({ ...draft, ghl_subaccount_id: e.target.value })}
          placeholder="GHL ID"
        />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm" style={{ color: '#0D1B2A' }}>
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
            />
            Active
          </label>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs" style={{ color: '#5A6573' }}>
        <span>Assigned {client.assigned_count} times</span>
        <span>
          Last:{' '}
          {client.last_assigned_at
            ? new Date(client.last_assigned_at).toLocaleString()
            : 'never'}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => onSave(draft)}
            disabled={!dirty}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-40"
            style={{ backgroundColor: '#0D1B2A', color: 'white' }}
          >
            <Save size={12} />
            Save
          </button>
          <button
            onClick={onRemove}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold border"
            style={{ borderColor: '#E0DAD0', color: '#8A2A2A', backgroundColor: 'white' }}
          >
            <Trash2 size={12} />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

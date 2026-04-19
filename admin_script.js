/* 
   ADMIN_SCRIPT.JS
   Shared logic for VTT Admin Dashboard pages
*/

// --- State & Config ---
let db = null;
const AUTH_KEY = 'vtt_admin_authenticated';

// --- Initialization ---
initSupabase(); // Initialize immediately when script is loaded

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

function initSupabase() {
    try {
        const supabaseUrl = PAYMENT_CONFIG.SUPABASE.URL;
        const supabaseKey = PAYMENT_CONFIG.SUPABASE.ANON_KEY;
        
        if (typeof window.supabase !== 'undefined' && 
            supabaseUrl && 
            !supabaseUrl.includes('your-project-id')) {
            db = window.supabase.createClient(supabaseUrl, supabaseKey);
        }
    } catch (e) {
        console.warn('Supabase initialization failed:', e);
    }
}

// --- Authentication Logic ---
function checkAuthStatus() {
    const isAuth = sessionStorage.getItem(AUTH_KEY);
    const overlay = document.getElementById('authOverlay');
    
    if (isAuth === 'true') {
        if (overlay) overlay.style.display = 'none';
        initDashboard();
    } else {
        if (overlay) overlay.style.display = 'flex';
    }
}

function authenticate() {
    const passInput = document.getElementById('passInput');
    if (passInput.value === PAYMENT_CONFIG.ADMIN.PASSWORD) {
        sessionStorage.setItem(AUTH_KEY, 'true');
        const overlay = document.getElementById('authOverlay');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            initDashboard();
        }, 800);
    } else {
        handleAuthError(passInput);
    }
}

function handleAuthError(input) {
    input.style.borderColor = "#ff4444";
    input.style.boxShadow = "0 0 0 4px rgba(255, 68, 68, 0.1)";
    input.placeholder = "Wrong password — try again";
    setTimeout(() => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        input.placeholder = '••••••••';
    }, 2000);
    input.value = "";
    input.focus();
}

function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.reload();
}

// Support for Enter key
if (document.getElementById('passInput')) {
    document.getElementById('passInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') authenticate();
    });
}

// --- Data Fetching ---
async function initDashboard() {
    if (!db) {
        handleNoDatabase();
        return;
    }

    // Determine which page we are on and load relevant data
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'admin.html';
    
    console.log("Admin Dashboard Initializing for page:", page);

    if (page === 'admin.html') {
        loadOverviewData();
    } else if (page === 'admin_donations.html') {
        fetchTransactions();
    } else if (page === 'admin_media.html') {
        fetchMedia();
    } else if (page === 'admin_contacts.html' || page.includes('admin_contacts')) {
        loadContacts();
    } else if (page === 'admin_testimonials.html') {
        loadTestimonials();
    }
}

// --- Testimonials Logic ---
async function loadTestimonials() {
    if (!db) return;
    try {
        const { data, error } = await db.from('testimonials').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        const body = document.getElementById('testimonialsTableBody');
        if (!body) return;

        if (!data || data.length === 0) {
            body.innerHTML = '<tr><td colspan="6" style="text-align:center;opacity:0.5;padding:30px">No stories submitted yet</td></tr>';
            return;
        }

        body.innerHTML = data.map(t => `
            <tr>
                <td class="timestamp">${new Date(t.created_at).toLocaleDateString()}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px">
                        <img src="${t.photo_url}" style="width:32px; height:32px; border-radius:50%">
                        <span>${t.name}</span>
                    </div>
                </td>
                <td class="donor-sub">${t.role}</td>
                <td class="text-message" title="${t.content}">${t.content.substring(0, 50)}${t.content.length > 50 ? '...' : ''}</td>
                <td>
                    <span class="status-pill ${t.status === 'Approved' ? 'status-success' : 'status-warning'}">${t.status}</span>
                </td>
                <td>
                    <div style="display:flex; gap:5px">
                        ${t.status === 'Pending' ? `<button class="btn-action" style="background:#2d5a27; color:white" onclick="approveTestimonial('${t.id}')">Approve</button>` : ''}
                        <button class="btn-action" onclick="deleteTestimonial('${t.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (e) { console.error('Testimonials error:', e); }
}

async function approveTestimonial(id) {
    if (!db) return;
    try {
        const { error } = await db.from('testimonials').update({ status: 'Approved' }).eq('id', id);
        if (error) throw error;
        loadTestimonials();
    } catch (e) { alert("Approval failed: " + e.message); }
}

async function deleteTestimonial(id) {
    if (!db) return;
    if (confirm("Permanently delete this story?")) {
        try {
            const { error } = await db.from('testimonials').delete().eq('id', id);
            if (error) throw error;
            loadTestimonials();
        } catch (e) { alert("Deletion failed: " + e.message); }
    }
}

function handleNoDatabase() {
    const selectors = ['statRevenue', 'statDonors', 'statMedia'];
    selectors.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = id === 'statRevenue' ? '₹0' : '0';
    });

    const bodies = ['transactionBody', 'mediaBody'];
    bodies.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:0.5;padding:30px">No database connected</td></tr>';
    });
}

// --- Page Specific Logic ---

// Overview Page
async function loadOverviewData() {
    try {
        const { data: donations } = await db.from('donations').select('amount');
        const total = donations ? donations.reduce((sum, d) => sum + Number(d.amount), 0) : 0;
        const donorCount = donations ? donations.length : 0;
        
        if (document.getElementById('statRevenue')) 
            document.getElementById('statRevenue').innerText = `₹${total.toLocaleString()}`;
        if (document.getElementById('statDonors')) 
            document.getElementById('statDonors').innerText = donorCount;

        const { count } = await db.from('media').select('*', { count: 'exact', head: true });
        if (document.getElementById('statMedia')) 
            document.getElementById('statMedia').innerText = count || 0;

        const { count: cCount } = await db.from('contacts').select('*', { count: 'exact', head: true });
        if (document.getElementById('statContacts')) 
            document.getElementById('statContacts').innerText = cCount || 0;

        fetchTransactions(5); // Show last 5
        fetchMedia(5); // Show last 5
        fetchContactsOverview(5); // Show last 5
    } catch (e) { console.error('Overview error:', e); }
}

async function fetchContactsOverview(limit = 5) {
    try {
        const { data } = await db.from('contacts').select('*').order('created_at', { ascending: false }).limit(limit);
        const body = document.getElementById('contactsOverviewBody');
        if (!body) return;

        if (!data || data.length === 0) {
            body.innerHTML = '<tr><td colspan="4" style="text-align:center;opacity:0.5;padding:20px">No inquiries</td></tr>';
            return;
        }

        body.innerHTML = data.map(c => `
            <tr>
                <td class="timestamp">${new Date(c.created_at).toLocaleDateString()}</td>
                <td class="donor-info">${c.name}</td>
                <td class="donor-sub">${c.email}</td>
                <td class="ref-id">${c.message.substring(0, 40)}${c.message.length > 40 ? '...' : ''}</td>
            </tr>
        `).join('');
    } catch (e) { console.error('Contacts overview error:', e); }
}

// Donations Page
async function fetchTransactions(limit = null) {
    try {
        let query = db.from('donations').select('*').order('created_at', { ascending: false });
        if (limit) query = query.limit(limit);
        
        const { data } = await query;
        const body = document.getElementById('transactionBody');
        if (!body) return;

        if (!data || data.length === 0) {
            body.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:0.5;padding:30px">No donations yet</td></tr>';
            return;
        }

        body.innerHTML = data.map(trx => `
            <tr>
                <td>
                    <div class="donor-info">${trx.donor_name}</div>
                    <div class="donor-sub">${trx.email}</div>
                </td>
                <td class="td-amount">₹${Number(trx.amount).toLocaleString()}</td>
                <td class="timestamp">${new Date(trx.created_at).toLocaleString()}</td>
                <td><span class="status-pill status-success">Verified</span></td>
                <td class="ref-id">${trx.transaction_id || 'LOCAL_SIM'}</td>
            </tr>
        `).join('');
    } catch (e) { console.error('Transactions error:', e); }
}

// Media Page
async function fetchMedia(limit = null) {
    try {
        let query = db.from('media').select('*').order('created_at', { ascending: false });
        if (limit) query = query.limit(limit);
        
        const { data } = await query;
        const body = document.getElementById('mediaBody');
        if (!body) return;

        if (!data || data.length === 0) {
            body.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:0.5;padding:30px">No media assets found</td></tr>';
            return;
        }

        body.innerHTML = data.map(m => `
            <tr>
                <td><span class="asset-title">${m.title}</span></td>
                <td><span class="asset-cat">${m.category}</span></td>
                <td><span class="asset-type">${m.type}</span></td>
                <td><span class="asset-status">● Active</span></td>
                <td>
                    <button class="btn-action" onclick="removeMedia('${m.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error('Media error:', e); }
}

async function removeMedia(id) {
    if (!db) return;
    if (confirm("Permanently delete this asset?")) {
        const { error } = await db.from('media').delete().eq('id', id);
        if (!error) fetchMedia();
    }
}

// --- CSV Export Logic ---
async function exportDonationsToCSV() {
    if (!db) {
        alert("Database not connected. Cannot export data.");
        return;
    }

    try {
        const { data, error } = await db.from('donations').select('*').order('created_at', { ascending: false });
        
        if (error) throw error;
        if (!data || data.length === 0) {
            alert("No donation records found to export.");
            return;
        }

        // CSV Headers
        const headers = ["Donor Name", "Email", "Amount (INR)", "Date", "Transaction ID"];
        
        // Convert rows
        const csvRows = [
            headers.join(','),
            ...data.map(row => [
                `"${row.donor_name}"`,
                `"${row.email}"`,
                row.amount,
                `"${new Date(row.created_at).toLocaleString()}"`,
                `"${row.transaction_id || 'LOCAL'}"`
            ].join(','))
        ];

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `vtt_donations_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (e) {
        console.error('Export Error:', e);
        alert("Failed to generate CSV: " + e.message);
    }
}

// --- Media Upload Logic ---
function showUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.classList.add('active');
}

function hideUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.classList.remove('active');
}

async function handleMediaUpload(event) {
    event.preventDefault();
    if (!db) {
        alert("Database not connected.");
        return;
    }

    const title = document.getElementById('uploadTitle').value;
    const category = document.getElementById('uploadCategory').value;
    const type = document.getElementById('uploadType').value;
    const url = document.getElementById('uploadUrl').value;

    if (!title || !url) {
        alert("Please provide at least a title and a source URL.");
        return;
    }

    try {
        const { error } = await db.from('media').insert([
            { title, category, type, source_url: url }
        ]);

        if (error) throw error;

        alert("Asset uploaded successfully!");
        hideUploadModal();
        event.target.reset();
        
        // Refresh media lists if they exist on current page
        const page = window.location.pathname.split('/').pop() || 'admin.html';
        if (page === 'admin.html' || page === 'admin_media.html') {
            fetchMedia();
        }
    } catch (e) {
        console.error('Upload Error:', e);
        alert("Failed to save asset: " + e.message);
    }
}

// --- Dynamic Settings Control ---
async function loadSettingsIntoUI() {
    if (!db) return;
    try {
        const { data, error } = await db.from('settings').select('*');
        if (error) throw error;
        
        data.forEach(setting => {
            if (setting.id === 'upi_id') {
                const input = document.getElementById('upi_id_input');
                if (input) input.value = setting.value;
            }
            if (setting.id === 'upi_name') {
                const input = document.getElementById('upi_name_input');
                if (input) input.value = setting.value;
            }
            // Impact Settings
            if (setting.id === 'stat_families') {
                const input = document.getElementById('stat_families_input');
                if (input) input.value = setting.value;
            }
            if (setting.id === 'stat_volunteers') {
                const input = document.getElementById('stat_volunteers_input');
                if (input) input.value = setting.value;
            }
            if (setting.id === 'stat_media_override') {
                const input = document.getElementById('stat_media_override');
                if (input) input.value = setting.value;
            }
        });
    } catch (e) {
        console.error('Load Settings Error:', e);
    }
}

async function updateSystemSettings() {
    if (!db) return;
    const upiId = document.getElementById('upi_id_input').value;
    const upiName = document.getElementById('upi_name_input').value;

    if (!upiId || !upiName) {
        alert("UPI ID and Name cannot be empty.");
        return;
    }

    try {
        const { error: err1 } = await db.from('settings').upsert({ id: 'upi_id', value: upiId });
        const { error: err2 } = await db.from('settings').upsert({ id: 'upi_name', value: upiName });

        if (err1 || err2) throw (err1 || err2);

        alert("Settings updated successfully! Changes are live on the frontend.");
    } catch (e) {
        console.error('Update Settings Error:', e);
        alert("Failed to update settings: " + e.message);
    }
}

async function updateImpactSettings() {
    if (!db) return;
    
    const families = document.getElementById('stat_families_input').value;
    const volunteers = document.getElementById('stat_volunteers_input').value;
    const mediaOverride = document.getElementById('stat_media_override').value;

    try {
        const updates = [
            { id: 'stat_families', value: families },
            { id: 'stat_volunteers', value: volunteers },
            { id: 'stat_media_override', value: mediaOverride }
        ];

        for (const item of updates) {
            const { error } = await db.from('settings').upsert(item);
            if (error) throw error;
        }

        alert("Impact statistics saved successfully! The home page counters will now use these values.");
    } catch (e) {
        console.error('Update Impact Settings Error:', e);
        alert("Failed to save impact data: " + e.message);
    }
}
// --- Inquiries Page ---
async function loadContacts(limit = null) {
    if (!db) {
        console.error("Database connection not initialized.");
        return;
    }
    
    try {
        let query = db.from('contacts').select('*').order('created_at', { ascending: false });
        if (limit) query = query.limit(limit);
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Supabase Query Error:', error);
            const body = document.getElementById('contactsTableBody');
            if (body) body.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center; padding:20px">Error: ${error.message}. <br>Make sure the 'contacts' table exists and RLS policies are set.</td></tr>`;
            return;
        }

        const body = document.getElementById('contactsTableBody');
        if (!body) return;

        if (!data || data.length === 0) {
            body.innerHTML = '<tr><td colspan="7" style="text-align:center;opacity:0.5;padding:30px">No inquiries yet</td></tr>';
            return;
        }

        body.innerHTML = data.map(c => `
            <tr>
                <td class="timestamp">${new Date(c.created_at).toLocaleDateString()}</td>
                <td class="donor-info">${c.name}</td>
                <td class="donor-sub">${c.email}</td>
                <td class="ref-id">${c.phone || '-'}</td>
                <td class="text-message" title="${c.message}">${c.message.substring(0, 30)}${c.message.length > 30 ? '...' : ''}</td>
                <td><span class="status-pill ${c.status === 'New' ? 'status-warning' : 'status-success'}">${c.status}</span></td>
                <td>
                    <button class="btn-action" onclick="deleteContact('${c.id}')">Archive</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error('Contacts error:', e); }
}

async function deleteContact(id) {
    if (!db) return;
    if (confirm("Archive this inquiry?")) {
        const { error } = await db.from('contacts').delete().eq('id', id);
        if (!error) loadContacts();
    }
}

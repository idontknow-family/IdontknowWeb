const searchInput = document.getElementById('searchInput');
const grid = document.getElementById('memberGrid');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('memberModal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');

let currentRank = 'ALL';
let currentStatus = 'ALL';
let debounceTimer = null;

document.querySelectorAll('.filter-btn[data-rank]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn[data-rank]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentRank = btn.dataset.rank;
    fetchMembers();
  });
});

document.querySelectorAll('.filter-btn[data-status]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn[data-status]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentStatus = btn.dataset.status;
    fetchMembers();
  });
});

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchMembers, 250);
});

const RANK_BADGE_CLASS = {
  LEADER: 'badge-leader',
  CO_LEADER: 'badge-co_leader',
  HIGH_COMMAND: 'badge-high_command',
  OFFICIAL_MEMBER: 'badge-official_member',
  RECRUIT: 'badge-recruit',
};

async function fetchMembers() {
  const params = new URLSearchParams({
    q: searchInput.value.trim(),
    rank: currentRank,
    status: currentStatus,
  });

  const res = await fetch(`/api/members?${params.toString()}`);
  const data = await res.json();
  renderGrid(data.members, data.rankLabels);
}

function renderGrid(members, rankLabels) {
  grid.innerHTML = '';
  if (!members.length) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  members.forEach((m) => {
    const card = document.createElement('div');
    card.className = 'member-card glass-card rounded-2xl p-6 text-center cursor-pointer';
    card.dataset.id = m.id;

    const avatar = m.avatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(m.icName)}`;

    card.innerHTML = `
      <img src="${avatar}" alt="${m.icName}" class="avatar-ring w-20 h-20 rounded-full object-cover mx-auto mb-4" />
      <h3 class="font-display text-lg text-white font-600">${m.icName}</h3>
      <p class="text-white/40 text-xs mt-0.5">@${m.discordTag}</p>
      <div class="flex items-center justify-center gap-2 mt-3">
        <span class="badge ${RANK_BADGE_CLASS[m.rank]}">${rankLabels[m.rank]}</span>
      </div>
      <div class="flex items-center justify-center gap-1.5 mt-3">
        <span class="status-dot status-${m.status.toLowerCase()}"></span>
        <span class="text-[11px] text-white/40 uppercase tracking-wider">${m.status}</span>
      </div>
      ${m.specialty ? `<p class="text-white/30 text-xs mt-2 truncate">${m.specialty}</p>` : ''}
    `;
    grid.appendChild(card);
  });
}

grid.addEventListener('click', (e) => {
  const card = e.target.closest('.member-card');
  if (card) openModal(card.dataset.id);
});

async function openModal(id) {
  const res = await fetch(`/api/members/${id}`);
  if (!res.ok) return;
  const { member: m, rankLabels } = await res.json();

  const avatar = m.avatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(m.icName)}`;
  const joinDate = new Date(m.joinDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  modalContent.innerHTML = `
    <img src="${avatar}" alt="${m.icName}" class="avatar-ring w-24 h-24 rounded-full object-cover mx-auto mb-4" />
    <h2 class="font-display text-2xl text-white font-700">${m.icName}</h2>
    <p class="text-white/40 text-sm">@${m.discordTag} &middot; ${m.oocName}</p>
    <div class="flex items-center justify-center gap-2 mt-3">
      <span class="badge ${RANK_BADGE_CLASS[m.rank]}">${rankLabels[m.rank]}</span>
      <span class="text-[11px] text-white/40 uppercase tracking-wider flex items-center gap-1.5">
        <span class="status-dot status-${m.status.toLowerCase()}"></span>${m.status}
      </span>
    </div>
    <div class="text-left mt-6 space-y-3 text-sm">
      <div class="flex justify-between border-b border-white/5 pb-2">
        <span class="text-white/40">Joined</span><span class="text-white/80">${joinDate}</span>
      </div>
      ${m.specialty ? `<div class="flex justify-between border-b border-white/5 pb-2"><span class="text-white/40">Specialty</span><span class="text-white/80">${m.specialty}</span></div>` : ''}
      ${m.primaryGear ? `<div class="flex justify-between border-b border-white/5 pb-2"><span class="text-white/40">Primary Gear</span><span class="text-white/80">${m.primaryGear}</span></div>` : ''}
      ${m.phoneNumber ? `<div class="flex justify-between border-b border-white/5 pb-2"><span class="text-white/40">Phone</span><span class="text-white/80">${m.phoneNumber}</span></div>` : ''}
      ${m.notes ? `<div class="pt-2"><span class="text-white/40 block mb-1">Notes</span><p class="text-white/70">${m.notes}</p></div>` : ''}
    </div>
  `;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

function closeModal() {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

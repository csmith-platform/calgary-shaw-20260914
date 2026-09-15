export const PARTY_COLORS = {
  UCP: '#1C4583',
  NDP: '#F4821A',
  LIB: '#D71920',
  TORY: '#5B2C83',
  IND: '#7B8794',
}

export const UNREPORTED_COLOR = '#4B5563'
export const TIE_COLOR = '#9CA3AF'

export function summarizePoll(poll, candidates) {
  const candidateById = new Map(candidates.map((candidate) => [candidate.candidateID, candidate]))
  const rows = (poll.pollStats ?? []).map((stat) => {
    const candidate = candidateById.get(stat.candidateID)
    return {
      candidateID: stat.candidateID,
      name: candidate?.candidateName ?? 'Unknown',
      party: candidate?.partyAbbreviation ?? 'OTHER',
      votes: stat.votes ?? 0,
    }
  }).sort((a, b) => b.votes - a.votes)

  const total = rows.reduce((sum, row) => sum + row.votes, 0)
  const reported = rows.length > 0
  const top = rows[0]
  const second = rows[1]
  const tied = reported && second && top.votes === second.votes
  const marginVotes = reported && second ? top.votes - second.votes : 0
  const marginPct = total > 0 ? (marginVotes / total) * 100 : 0

  return {
    poll: poll.poll,
    pollName: poll.pollName,
    pollTypeCode: poll.pollTypeCode,
    reported,
    total,
    rows: rows.map((row) => ({ ...row, pct: total > 0 ? (row.votes / total) * 100 : 0 })),
    winner: tied ? 'TIE' : top?.party ?? null,
    marginVotes,
    marginPct,
  }
}

export function normalizeResults(payload) {
  const candidateResults = payload?.candidateResults ?? {}
  const candidates = candidateResults.candidates ?? []
  const widgets = candidateResults.widgets ?? {}
  const votes = candidateResults.votes ?? {}
  const ward = votes.wardStats?.[0] ?? null
  const pollGroups = votes.pollVotes ?? {}
  const votingDay = (pollGroups.votingDay ?? []).map((poll) => summarizePoll(poll, candidates))

  const candidateByParty = new Map(candidates.map((candidate) => [candidate.partyAbbreviation, candidate]))
  const totals = (ward?.wardVotes ?? []).map((row) => {
    const candidate = candidates.find((candidate) => candidate.partyID === row.partyID)
    const totalValid = ward?.valid ?? widgets.summary?.valid ?? 0
    return {
      party: candidate?.partyAbbreviation ?? 'OTHER',
      name: candidate?.candidateName ?? 'Unknown',
      votes: row.votes ?? 0,
      pct: totalValid > 0 ? ((row.votes ?? 0) / totalValid) * 100 : 0,
    }
  }).sort((a, b) => b.votes - a.votes)

  return {
    success: payload?.success === true,
    lastUpdated: payload?.lastUpdated ?? null,
    candidates,
    candidateByParty,
    summary: {
      valid: ward?.valid ?? widgets.summary?.valid ?? 0,
      pollsReporting: ward?.pollsReporting ?? widgets.summary?.pollsReporting ?? 0,
      totalPolls: ward?.totalPolls ?? widgets.summary?.totalPolls ?? 0,
      totals,
    },
    widgets,
    votingDay,
  }
}

export function pollFillColor(poll) {
  if (!poll?.reported) return UNREPORTED_COLOR
  if (poll.winner === 'TIE') return TIE_COLOR
  return PARTY_COLORS[poll.winner] ?? '#9CA3AF'
}

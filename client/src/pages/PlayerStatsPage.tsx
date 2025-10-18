import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  Card,
  CardContent,
  CardHeader,
  Headline3,
  Headline4,
  Body2
} from 'gobble-lib-react';
import stats2324 from '../data/nba-player-stats-23-24.json';
import stats2425 from '../data/nba-player-stats-24-25.json';

type StatKey = 'pts' | 'reb' | 'ast' | 'stl' | 'blk' | 'tov' | 'fgPct' | 'threePm';
type ColumnKey = StatKey | 'gamesPlayed';
type StatViewMode = 'averages' | 'totals';

type ThresholdMap = Partial<Record<StatKey, number>>;

interface PlayerStatLine {
  name: string;
  team: string;
  position: string;
  gamesPlayed: number;
  averages: Record<StatKey, number>;
  totals: Record<StatKey, number>;
}

interface SeasonStats {
  season: string;
  players: PlayerStatLine[];
}

interface StatColumn {
  key: ColumnKey;
  label: { averages: string; totals: string };
  decimals: { averages: number; totals: number };
  isPercentage?: boolean;
}

const seasonData: Record<'2023-24' | '2024-25', SeasonStats> = {
  '2023-24': stats2324 as SeasonStats,
  '2024-25': stats2425 as SeasonStats
};

const statColumns: StatColumn[] = [
  {
    key: 'gamesPlayed',
    label: { averages: 'GP', totals: 'GP' },
    decimals: { averages: 0, totals: 0 }
  },
  {
    key: 'pts',
    label: { averages: 'PTS/G', totals: 'PTS' },
    decimals: { averages: 1, totals: 1 }
  },
  {
    key: 'reb',
    label: { averages: 'REB/G', totals: 'REB' },
    decimals: { averages: 1, totals: 1 }
  },
  {
    key: 'ast',
    label: { averages: 'AST/G', totals: 'AST' },
    decimals: { averages: 1, totals: 1 }
  },
  {
    key: 'stl',
    label: { averages: 'STL/G', totals: 'STL' },
    decimals: { averages: 1, totals: 1 }
  },
  {
    key: 'blk',
    label: { averages: 'BLK/G', totals: 'BLK' },
    decimals: { averages: 1, totals: 1 }
  },
  {
    key: 'threePm',
    label: { averages: '3PM/G', totals: '3PM' },
    decimals: { averages: 1, totals: 1 }
  },
  {
    key: 'tov',
    label: { averages: 'TOV/G', totals: 'TOV' },
    decimals: { averages: 1, totals: 1 }
  },
  {
    key: 'fgPct',
    label: { averages: 'FG%', totals: 'FG%' },
    decimals: { averages: 1, totals: 1 },
    isPercentage: true
  }
];

const thresholdConfig: { key: StatKey; label: string; placeholder: string }[] = [
  { key: 'pts', label: 'Points', placeholder: 'Min PTS' },
  { key: 'reb', label: 'Rebounds', placeholder: 'Min REB' },
  { key: 'ast', label: 'Assists', placeholder: 'Min AST' },
  { key: 'stl', label: 'Steals', placeholder: 'Min STL' },
  { key: 'blk', label: 'Blocks', placeholder: 'Min BLK' }
];

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const FiltersCard = styled(Card)`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
`;

const FiltersLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
`;

const ToggleGroup = styled.div`
  display: inline-flex;
  border-radius: 12px;
  background-color: #e2e8f0;
  padding: 4px;
`;

const ToggleButton = styled.button<{ $active?: boolean }>`
  border: none;
  background: ${({ $active }) => ($active ? '#0f172a' : 'transparent')};
  color: ${({ $active }) => ($active ? '#f8fafc' : '#1f2937')};
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: ${({ $active }) => ($active ? '#0f172a' : 'rgba(15, 23, 42, 0.15)')};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #cbd5f5;
  background-color: #ffffff;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #cbd5f5;
  background-color: #ffffff;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
`;

const StatsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 920px;
`;

const TableHeadCell = styled.th<{ $sortable?: boolean }>`
  text-align: left;
  padding: 12px 16px;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #1f2937;
  background: #e2e8f0;
  border-bottom: 2px solid #cbd5f5;
  cursor: ${({ $sortable }) => ($sortable ? 'pointer' : 'default')};
  user-select: none;
`;

const TableDataCell = styled.td`
  padding: 14px 16px;
  font-size: 0.95rem;
  color: #1f2937;
  border-bottom: 1px solid #e2e8f0;
  text-align: right;
`;

const NameCell = styled.td`
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
`;

const PlayerName = styled.div`
  font-weight: 700;
  color: #0f172a;
`;

const PlayerMeta = styled.div`
  font-size: 0.8rem;
  color: #64748b;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: rgba(241, 245, 249, 0.6);
  }

  &:hover {
    background-color: rgba(226, 232, 240, 0.8);
  }
`;

const SortIndicator = styled.span`
  margin-left: 6px;
  font-size: 0.75rem;
  opacity: 0.7;
`;

const EmptyState = styled.div`
  padding: 48px 24px;
  text-align: center;
  color: #64748b;
`;

const PlayerStatsPage = () => {
  const [season, setSeason] = useState<'2023-24' | '2024-25'>('2024-25');
  const [viewMode, setViewMode] = useState<StatViewMode>('averages');
  const [searchTerm, setSearchTerm] = useState('');
  const [thresholds, setThresholds] = useState<ThresholdMap>({});
  const [sortKey, setSortKey] = useState<ColumnKey>('pts');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const currentSeason = seasonData[season];

  const handleSort = (column: ColumnKey) => {
    setSortKey((prevKey) => {
      if (prevKey === column) {
        setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
        return prevKey;
      }

      setSortDirection('desc');
      return column;
    });
  };

  const updateThreshold = (key: StatKey, value: string) => {
    const parsed = value === '' ? undefined : Number(value);
    const numericValue = parsed === undefined || Number.isNaN(parsed) ? undefined : parsed;

    setThresholds((prev) => ({
      ...prev,
      [key]: numericValue
    }));
  };

  const statValue = (player: PlayerStatLine, column: ColumnKey): number => {
    if (column === 'gamesPlayed') {
      return player.gamesPlayed;
    }

    return player[viewMode][column];
  };

  const filteredPlayers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return currentSeason.players
      .filter((player) => {
        const matchesSearch =
          query.length === 0 ||
          player.name.toLowerCase().includes(query) ||
          player.team.toLowerCase().includes(query) ||
          player.position.toLowerCase().includes(query);

        if (!matchesSearch) {
          return false;
        }

        for (const [key, min] of Object.entries(thresholds) as [StatKey, number | undefined][]) {
          if (min === undefined) {
            continue;
          }

          if (player[viewMode][key] < min) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const aValue = statValue(a, sortKey);
        const bValue = statValue(b, sortKey);

        if (aValue === bValue) {
          return a.name.localeCompare(b.name);
        }

        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [currentSeason.players, searchTerm, thresholds, viewMode, sortKey, sortDirection]);

  const formatValue = (player: PlayerStatLine, column: StatColumn) => {
    const decimals = column.decimals[viewMode];

    if (column.key === 'gamesPlayed') {
      return player.gamesPlayed.toString();
    }

    const value = player[viewMode][column.key];

    if (column.isPercentage) {
      return `${(value * 100).toFixed(decimals)}%`;
    }

    return value.toFixed(decimals);
  };

  const seasonOptions = Object.keys(seasonData) as Array<'2023-24' | '2024-25'>;

  return (
    <PageWrapper>
      <Headline3 as="h2">NBA Player Stats Dashboard</Headline3>

      <FiltersCard>
        <CardHeader>
          <Headline4 as="h3">Filters</Headline4>
        </CardHeader>
        <CardContent>
          <FiltersLayout>
            <Label>
              Season
              <Select value={season} onChange={(event) => setSeason(event.target.value as '2023-24' | '2024-25')}>
                {seasonOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Label>

            <Label>
              Search Players
              <Input
                type="search"
                placeholder="Search by name, team, or position"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </Label>

            {thresholdConfig.map((config) => (
              <Label key={config.key}>
                {config.label}
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder={config.placeholder}
                  value={thresholds[config.key] ?? ''}
                  onChange={(event) => updateThreshold(config.key, event.target.value)}
                />
              </Label>
            ))}

            <Label>
              View Mode
              <ToggleGroup role="group" aria-label="Stat view mode">
                <ToggleButton
                  type="button"
                  $active={viewMode === 'averages'}
                  onClick={() => setViewMode('averages')}
                >
                  Per Game
                </ToggleButton>
                <ToggleButton
                  type="button"
                  $active={viewMode === 'totals'}
                  onClick={() => setViewMode('totals')}
                >
                  Totals
                </ToggleButton>
              </ToggleGroup>
            </Label>
          </FiltersLayout>
        </CardContent>
      </FiltersCard>

      <Card>
        <CardHeader>
          <Headline4 as="h3">{season} Player Leaders</Headline4>
          <Body2 as="p">{filteredPlayers.length} players match the current filters.</Body2>
        </CardHeader>
        <CardContent>
          {filteredPlayers.length === 0 ? (
            <EmptyState>
              No players match your filters. Adjust the thresholds or search criteria to broaden the results.
            </EmptyState>
          ) : (
            <StatsTable>
              <thead>
                <tr>
                  <TableHeadCell>Player</TableHeadCell>
                  {statColumns.map((column) => (
                    <TableHeadCell
                      key={column.key}
                      onClick={() => handleSort(column.key)}
                      $sortable
                    >
                      {column.label[viewMode]}
                      {sortKey === column.key && (
                        <SortIndicator>{sortDirection === 'asc' ? '▲' : '▼'}</SortIndicator>
                      )}
                    </TableHeadCell>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <TableRow key={`${season}-${player.name}`}>
                    <NameCell>
                      <PlayerName>{player.name}</PlayerName>
                      <PlayerMeta>
                        {player.team} • {player.position}
                      </PlayerMeta>
                    </NameCell>
                    {statColumns.map((column) => (
                      <TableDataCell key={column.key}>{formatValue(player, column)}</TableDataCell>
                    ))}
                  </TableRow>
                ))}
              </tbody>
            </StatsTable>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default PlayerStatsPage;

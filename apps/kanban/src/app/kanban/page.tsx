import KanbanBoard from './KanbanBoard';
import type { KanbanBoardProps } from '../../types/kanban';

const dummyProfile = { id: '1', full_name: 'Demo User' };
const props: KanbanBoardProps = { groupId: 'demo', profile: dummyProfile };

export default function KanbanPage() {
  return <KanbanBoard {...props} />;
}

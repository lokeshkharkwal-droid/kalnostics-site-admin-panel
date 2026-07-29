/**
 * Default props for every block type — what the palette inserts when
 * the user clicks a tile. Each factory returns a complete `Block`
 * value with a fresh id. Sensible placeholder text everywhere so the
 * preview shows something even before the user edits anything.
 */

import type { Block, BlockType } from '@/lib/pdf-v2-types';
import { newId } from './document-ops';

export function newBlock(type: BlockType): Block {
  switch (type) {
    case 'section':         return { id: newId(), type, props: { blocks: [] } };
    case 'columns':         return {
      id: newId(), type,
      props: { gap: '12px', columns: [{ blocks: [] }, { blocks: [] }] },
    };
    case 'divider':         return { id: newId(), type, props: { thickness: '1px', color: '#e2e8f0' } };
    case 'spacer':          return { id: newId(), type, props: { height: '8mm' } };
    case 'page-break':      return { id: newId(), type, props: {} };
    case 'page-number':     return { id: newId(), type, props: { format: 'Page {n} of {total}' } };
    case 'heading':         return { id: newId(), type, props: { level: 2, text: 'Heading' } };
    case 'paragraph':       return { id: newId(), type, props: { text: 'Paragraph text. Use {tokens} from the left panel.' } };
    case 'kv':              return { id: newId(), type, props: { label: 'Label', value: '{patient.full_name}' } };
    case 'image':           return { id: newId(), type, props: { src: 'https://via.placeholder.com/240x80', alt: '', width: '120px' } };
    case 'logo':            return { id: newId(), type, props: { width: '120px' } };
    case 'qr':              return { id: newId(), type, props: { value: '{order.display_id}', size: '120px' } };
    case 'signature':       return { id: newId(), type, props: { name: 'Dr. Name', title: 'Pathologist' } };
    case 'table':           return {
      id: newId(), type,
      props: {
        columns: [
          { key: 'name',  label: 'Test Name', width: '40%' },
          { key: 'value', label: 'Result',    width: '20%' },
          { key: 'range', label: 'Range',     width: '40%' },
        ],
        rows: '{tests[0].results}',
        striped: true,
      },
    };
    case 'parameters-table': return {
      id: newId(), type,
      props: { items: '{tests[0].results}', columns: ['status', 'name', 'value', 'unit', 'range'] },
    };
    case 'range-bar':       return {
      id: newId(), type,
      props: {
        title: 'Test Result',
        value: 0,
        low: 0, normal_low: 0, normal_high: 100, high: 100,
        unit: '',
      },
    };
    case 'score-circle':    return { id: newId(), type, props: { value: '{health_score}', max: 100, label: 'Score' } };
    case 'status-pill':     return { id: newId(), type, props: { status: 'normal', label: 'Normal' } };
    case 'result-card':     return { id: newId(), type, props: { item: '{r}' } };
    case 'note-card':       return { id: newId(), type, props: { title: 'Test Note', content: '{test.test_note}', hide_when_empty: true } };
    case 'organ-diagram':   return { id: newId(), type, props: { items: '{organs}', title: 'Organ Status' } };
    case 'donut-chart':     return { id: newId(), type, props: { slices: '{distribution}', title: '', size: '160px' } };
    case 'bar-chart':       return { id: newId(), type, props: { bars: '{distribution}', title: '', height: '120px' } };
    case 'line-chart':      return { id: newId(), type, props: { points: '{trend}', title: '', height: '120px' } };
    case 'repeat':          return { id: newId(), type, props: { items: '{tests}', as: 'test', blocks: [] } };
    case 'conditional':     return { id: newId(), type, props: { when: '{health_score}', blocks: [] } };
  }
}

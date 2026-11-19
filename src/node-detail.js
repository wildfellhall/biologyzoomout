export const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));

export function nodeDetail(ontology, node, reviewed) {
  const nodes = new Map(ontology.nodes.map(item => [item.id, item]));
  const relations = ontology.edges.filter(edge => edge.source === node.id || edge.target === node.id);
  const related = (id, rationale) => `<button class="related-node" data-open-node="${esc(id)}"><span>${esc(nodes.get(id)?.label || id)}<span aria-hidden="true">↗</span></span><small>${esc(id)}</small>${rationale ? `<p>${esc(rationale)}</p>` : ''}</button>`;
  const groups = [
    ['prerequisite',true,'Prerequisites'],
    ['prerequisite',false,'Supports'],
    ['recommended',null,'Recommended preparation'],
    ['transfer',null,'Transfer'],
    ['corequisite',null,'Co-requisites'],
    ['related',null,'Related nodes'],
  ];
  const standards = new Map(ontology.standards.map(standard => [standard.id, standard]));
  const mappings = ontology.alignments.filter(alignment => alignment.node_id === node.id);
  const children = ontology.nodes.filter(item => item.parent_ids.includes(node.id));
  return `
    <header class="detail-heading">
      <span class="node-id">${esc(node.id)} · ${esc(node.kind)}</span>
      <h2 id="node-title">${esc(node.label)}</h2>
      <p>${esc(node.outcome)}</p>
      <div class="detail-actions">
        <button id="go-to-model">View model ↗</button>
        <button id="review-node" aria-pressed="${reviewed}">${reviewed ? '✓ Reviewed' : 'Mark reviewed'}</button>
      </div>
    </header>
    <div class="detail-body">
      <div class="evidence-grid">
        <section><h3>Evidence</h3><p>${esc(node.evidence)}</p></section>
        <section><h3>Success criteria</h3><p>${esc(node.success_criteria)}</p></section>
      </div>
      ${node.notes ? `<p class="qualification">${esc(node.notes)}</p>` : ''}
      <h3>Relationships <span class="count">${relations.length}</span></h3>
      ${groups.map(([type,incoming,title]) => {
        const matching = relations.filter(edge => edge.relation === type && (incoming === null || (edge.target === node.id) === incoming));
        if (!matching.length) return '';
        return `<details class="connection-group" ${type === 'prerequisite' ? 'open' : ''}><summary><i class="relation-dot ${type}"></i>${title}<span>${matching.length}</span></summary>${matching.map(edge => related(edge.source === node.id ? edge.target : edge.source, `${edge.source === node.id ? 'Outgoing' : 'Incoming'} · ${edge.rationale}${edge.application_task ? ` Application: ${edge.application_task}` : ''}`)).join('')}</details>`;
      }).join('')}
      ${node.parent_ids.length || children.length ? `<details class="connection-group"><summary><i class="relation-dot part"></i>Capability structure<span>${node.parent_ids.length + children.length}</span></summary>${node.parent_ids.map(id => related(id,'Parent capability')).join('')}${children.map(child => related(child.id,'Subcapability')).join('')}</details>` : ''}
      <p class="method-note">Relationships are authored instructional inferences. Incoming hard prerequisites are conjunctive; containment does not impose learning order.</p>
      <section class="source-crosswalk"><h3>College Board alignment</h3>${mappings.length ? mappings.map(alignment => {
        const standard = standards.get(alignment.standard_id);
        return `<details><summary><a href="${esc(standard.source_url)}" target="_blank" rel="noopener">${esc(standard.code || standard.type)} ↗</a><span>${esc(standard.type)} · ${esc(alignment.relation)}</span></summary><p>${esc(alignment.rationale)}</p><small>${esc(standard.locator)}</small></details>`;
      }).join('') : '<p>Authored foundational capability; no additional official requirement is implied.</p>'}</section>
    </div>`;
}

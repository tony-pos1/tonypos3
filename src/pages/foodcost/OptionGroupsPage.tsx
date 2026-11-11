/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Option Groups Library Page
 * Create modifier groups once with choices, price deltas, and optional cost lines.
 * Reorder groups and choices by drag and by up/down arrows.
 */

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  GripVertical,
  DollarSign,
  Wheat,
  Package,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { OptionGroup, OptionChoice, CostLine } from '../../types/models';
import { calculateOptionChoiceCost } from '../../engine/calculations';

export const OptionGroupsPage: React.FC = () => {
  const {
    store,
    saveOptionGroup,
    deleteOptionGroup,
    reorderOptionGroups,
    ingredientsMap,
    packagingMap,
  } = useStore();

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);

  // Group Form
  const [nameTh, setNameTh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [required, setRequired] = useState(false);
  const [minChoices, setMinChoices] = useState(0);
  const [maxChoices, setMaxChoices] = useState(1);
  const [choices, setChoices] = useState<OptionChoice[]>([]);

  // Choice Edit Sub-Modal or Form
  const [editingChoiceIndex, setEditingChoiceIndex] = useState<number | null>(null);
  const [choiceNameTh, setChoiceNameTh] = useState('');
  const [choiceNameEn, setChoiceNameEn] = useState('');
  const [choicePriceDelta, setChoicePriceDelta] = useState(10);
  const [choiceCostLines, setChoiceCostLines] = useState<CostLine[]>([]);

  // Drag and drop state for groups
  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);
  const [draggedChoiceIndex, setDraggedChoiceIndex] = useState<{
    groupId: string;
    index: number;
  } | null>(null);

  const openAddGroupModal = () => {
    setEditingGroup(null);
    setNameTh('');
    setNameEn('');
    setRequired(false);
    setMinChoices(0);
    setMaxChoices(1);
    setChoices([
      { id: `c_${Date.now()}_1`, nameTh: 'ไข่ดาว', nameEn: 'Fried Egg', priceDelta: 10 },
      { id: `c_${Date.now()}_2`, nameTh: 'ไข่เจียว', nameEn: 'Omelet', priceDelta: 15 },
    ]);
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (grp: OptionGroup) => {
    setEditingGroup(grp);
    setNameTh(grp.nameTh);
    setNameEn(grp.nameEn);
    setRequired(grp.required);
    setMinChoices(grp.minChoices);
    setMaxChoices(grp.maxChoices);
    setChoices(grp.choices ? [...grp.choices] : []);
    setIsGroupModalOpen(true);
  };

  // Reorder Groups
  const moveGroup = (index: number, direction: 'up' | 'down') => {
    const newGroups = [...store.optionGroups];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newGroups.length) return;

    const temp = newGroups[index];
    newGroups[index] = newGroups[target];
    newGroups[target] = temp;

    reorderOptionGroups(newGroups);
  };

  // Drag Reorder Groups
  const handleGroupDragStart = (index: number) => {
    setDraggedGroupIndex(index);
  };

  const handleGroupDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedGroupIndex === null || draggedGroupIndex === index) return;

    const newGroups = [...store.optionGroups];
    const draggedItem = newGroups[draggedGroupIndex];
    newGroups.splice(draggedGroupIndex, 1);
    newGroups.splice(index, 0, draggedItem);
    setDraggedGroupIndex(index);
    reorderOptionGroups(newGroups);
  };

  // Reorder Choices Inside a Group
  const moveChoice = (group: OptionGroup, choiceIndex: number, direction: 'up' | 'down') => {
    const newChoices = [...group.choices];
    const target = direction === 'up' ? choiceIndex - 1 : choiceIndex + 1;
    if (target < 0 || target >= newChoices.length) return;

    const temp = newChoices[choiceIndex];
    newChoices[choiceIndex] = newChoices[target];
    newChoices[target] = temp;

    saveOptionGroup({
      ...group,
      choices: newChoices,
    });
  };

  // Drag Reorder Choices Inside a Group
  const handleChoiceDragStart = (groupId: string, index: number) => {
    setDraggedChoiceIndex({ groupId, index });
  };

  const handleChoiceDragOver = (e: React.DragEvent, group: OptionGroup, targetIndex: number) => {
    e.preventDefault();
    if (!draggedChoiceIndex || draggedChoiceIndex.groupId !== group.id) return;
    if (draggedChoiceIndex.index === targetIndex) return;

    const newChoices = [...group.choices];
    const draggedItem = newChoices[draggedChoiceIndex.index];
    newChoices.splice(draggedChoiceIndex.index, 1);
    newChoices.splice(targetIndex, 0, draggedItem);

    setDraggedChoiceIndex({ groupId: group.id, index: targetIndex });
    saveOptionGroup({
      ...group,
      choices: newChoices,
    });
  };

  // Handle Choice creation inside modal
  const handleAddChoice = () => {
    const newChoice: OptionChoice = {
      id: `choice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nameTh: 'ตัวเลือกใหม่',
      nameEn: 'New Option',
      priceDelta: 0,
      costLines: [],
    };
    setChoices([...choices, newChoice]);
  };

  const handleRemoveChoice = (index: number) => {
    setChoices(choices.filter((_, idx) => idx !== index));
  };

  const handleUpdateChoice = (index: number, updates: Partial<OptionChoice>) => {
    const updated = [...choices];
    updated[index] = { ...updated[index], ...updates };
    setChoices(updated);
  };

  // Add Cost Line to a choice
  const handleAddCostLineToChoice = (choiceIndex: number) => {
    const updated = [...choices];
    const choice = updated[choiceIndex];
    const costLines = choice.costLines ? [...choice.costLines] : [];

    const defaultItem = store.ingredients[0];
    if (defaultItem) {
      costLines.push({
        type: 'ingredient',
        itemId: defaultItem.id,
        quantity: 1,
        unit: defaultItem.baseUnit,
      });
      choice.costLines = costLines;
      setChoices(updated);
    }
  };

  const handleRemoveCostLineFromChoice = (choiceIndex: number, lineIndex: number) => {
    const updated = [...choices];
    const choice = updated[choiceIndex];
    if (!choice.costLines) return;
    choice.costLines = choice.costLines.filter((_, idx) => idx !== lineIndex);
    setChoices(updated);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameTh.trim()) return;

    const now = new Date().toISOString();

    const groupData: OptionGroup = {
      id: editingGroup ? editingGroup.id : `optgrp_${Date.now()}`,
      nameTh: nameTh.trim(),
      nameEn: nameEn.trim(),
      required,
      minChoices: Number(minChoices) || 0,
      maxChoices: Number(maxChoices) || 1,
      choices,
      order: editingGroup ? editingGroup.order : store.optionGroups.length + 1,
      createdAt: editingGroup ? editingGroup.createdAt : now,
      updatedAt: now,
      version: editingGroup ? editingGroup.version + 1 : 1,
    };

    await saveOptionGroup(groupData);
    setIsGroupModalOpen(false);
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Option Group Library</h2>
          <p className="text-xs text-neutral-500">
            Create reusable modifier groups once (e.g. Spice Level, Extra Egg, Sauce, Packaging) and attach to any dish by checking a box.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddGroupModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Option Group</span>
        </button>
      </div>

      <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span>Option Group Design: </span>
          <span>
            Each option choice can define an additional <strong>Selling Price Delta (+฿)</strong> and optional <strong>Cost Lines</strong> (ingredients or packaging used). Reorder groups and choices with drag handles or up/down arrows.
          </span>
        </div>
      </div>

      {store.optionGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Layers className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-700">No option groups created yet</p>
          <p className="text-xs text-neutral-400 mt-1">
            Create add-on options like extra meat, egg variations, noodle types, or takeaway container choices.
          </p>
          <button
            type="button"
            onClick={openAddGroupModal}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
          >
            Create First Option Group
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {store.optionGroups.map((group, index) => {
            const isFirst = index === 0;
            const isLast = index === store.optionGroups.length - 1;

            return (
              <div
                key={group.id}
                draggable
                onDragStart={() => handleGroupDragStart(index)}
                onDragOver={(e) => handleGroupDragOver(e, index)}
                onDragEnd={() => setDraggedGroupIndex(null)}
                className={`bg-white rounded-xl border border-neutral-200 p-5 shadow-xs transition-shadow ${
                  draggedGroupIndex === index ? 'opacity-40 border-dashed border-amber-400' : ''
                }`}
              >
                {/* Group Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-700 p-1"
                      title="Drag to reorder group"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Up / Down Buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveGroup(index, 'up')}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-20 transition-colors"
                        title="Move Group Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveGroup(index, 'down')}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-20 transition-colors"
                        title="Move Group Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <span>{group.nameTh}</span>
                        {group.nameEn && (
                          <span className="text-xs font-normal text-neutral-400">
                            ({group.nameEn})
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            group.required
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {group.required ? 'Mandatory' : 'Optional'}
                        </span>
                      </h3>
                      <span className="text-[11px] text-neutral-400">
                        Min: {group.minChoices} · Max: {group.maxChoices} choices · Attached to{' '}
                        {store.dishes.filter((d) => d.optionGroupIds.includes(group.id)).length} dishes
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditGroupModal(group)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="Edit Group"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete option group "${group.nameTh}"?`)) {
                          deleteOptionGroup(group.id);
                        }
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Choices List */}
                <div className="pt-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                    <span>Option Choices ({group.choices?.length || 0})</span>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      Reorder with arrows or drag
                    </span>
                  </div>

                  <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
                    {group.choices && group.choices.length > 0 ? (
                      group.choices.map((choice, cIdx) => {
                        const choiceCost = calculateOptionChoiceCost(
                          choice.costLines,
                          ingredientsMap,
                          packagingMap
                        );

                        return (
                          <div
                            key={choice.id}
                            draggable
                            onDragStart={() => handleChoiceDragStart(group.id, cIdx)}
                            onDragOver={(e) => handleChoiceDragOver(e, group, cIdx)}
                            onDragEnd={() => setDraggedChoiceIndex(null)}
                            className="p-3 bg-white hover:bg-neutral-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Drag handle */}
                              <div
                                className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-600 p-0.5"
                                title="Drag choice"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>

                              {/* Up/Down */}
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  disabled={cIdx === 0}
                                  onClick={() => moveChoice(group, cIdx, 'up')}
                                  className="p-0.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-20"
                                  title="Move choice up"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={cIdx === group.choices.length - 1}
                                  onClick={() => moveChoice(group, cIdx, 'down')}
                                  className="p-0.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-20"
                                  title="Move choice down"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>

                              <div>
                                <span className="font-semibold text-neutral-900 text-xs">
                                  {choice.nameTh}
                                </span>
                                {choice.nameEn && (
                                  <span className="text-[11px] text-neutral-400 ml-1.5">
                                    ({choice.nameEn})
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs tabular-nums">
                              {choice.costLines && choice.costLines.length > 0 && (
                                <div className="text-[11px] text-neutral-500">
                                  <span>Cost delta: </span>
                                  <span className="font-semibold text-amber-800">
                                    {choiceCost.toFixed(2)} ฿
                                  </span>
                                </div>
                              )}

                              <div className="text-right">
                                <span className="text-[10px] text-neutral-400 block">Price Delta</span>
                                <span className="font-bold text-neutral-900">
                                  {choice.priceDelta > 0
                                    ? `+${choice.priceDelta.toFixed(2)} ฿`
                                    : 'Free (+0 ฿)'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-xs text-neutral-400">
                        No choices defined in this group.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Option Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl border border-neutral-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingGroup ? `Edit Option Group: ${editingGroup.nameTh}` : 'New Option Group'}
              </h3>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="text-xs px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Group Name (Thai) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ระดับความเผ็ด, เพิ่มท็อปปิ้ง"
                    value={nameTh}
                    onChange={(e) => setNameTh(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-medium outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Group Name (English)</label>
                  <input
                    type="text"
                    placeholder="e.g. Spice Level, Extra Toppings"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-medium outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Requirement & Choice limits */}
              <div className="grid grid-cols-3 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="grpRequired"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <label htmlFor="grpRequired" className="font-semibold text-neutral-800">
                    Required Selection
                  </label>
                </div>

                <div>
                  <label className="block text-neutral-600 mb-1">Min Choices</label>
                  <input
                    type="number"
                    min="0"
                    value={minChoices}
                    onChange={(e) => setMinChoices(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 font-bold outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 mb-1">Max Choices</label>
                  <input
                    type="number"
                    min="1"
                    value={maxChoices}
                    onChange={(e) => setMaxChoices(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 font-bold outline-hidden"
                  />
                </div>
              </div>

              {/* Choices builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800">
                    Choices in this Group ({choices.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddChoice}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Choice</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {choices.map((choice, cIdx) => (
                    <div
                      key={choice.id}
                      className="p-3 rounded-xl border border-neutral-200 bg-white shadow-2xs space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Choice (Thai) e.g. เผ็ดมาก"
                          value={choice.nameTh}
                          onChange={(e) => handleUpdateChoice(cIdx, { nameTh: e.target.value })}
                          className="flex-1 rounded-md border border-neutral-300 px-2.5 py-1 font-medium outline-hidden"
                        />
                        <input
                          type="text"
                          placeholder="Choice (Eng) e.g. Extra Spicy"
                          value={choice.nameEn}
                          onChange={(e) => handleUpdateChoice(cIdx, { nameEn: e.target.value })}
                          className="flex-1 rounded-md border border-neutral-300 px-2.5 py-1 font-medium outline-hidden"
                        />
                        <div className="w-28 flex items-center rounded-md border border-neutral-300 px-2 py-1 bg-white">
                          <span className="text-[10px] text-neutral-400 mr-1">+฿</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Price"
                            value={choice.priceDelta}
                            onChange={(e) =>
                              handleUpdateChoice(cIdx, { priceDelta: Number(e.target.value) })
                            }
                            className="w-full font-bold tabular-nums outline-hidden"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveChoice(cIdx)}
                          className="p-1 text-neutral-400 hover:text-rose-600"
                          title="Remove choice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Optional Cost Lines for this choice */}
                      <div className="pl-2 pt-1 border-t border-neutral-100 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] text-neutral-500">
                          <span>
                            Optional Ingredient / Packaging Cost Lines ({choice.costLines?.length || 0}):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddCostLineToChoice(cIdx)}
                            className="text-amber-800 font-semibold hover:underline"
                          >
                            + Add cost line
                          </button>
                        </div>

                        {choice.costLines && choice.costLines.length > 0 && (
                          <div className="space-y-1.5">
                            {choice.costLines.map((costLine, lIdx) => (
                              <div
                                key={lIdx}
                                className="flex items-center gap-2 p-1.5 rounded bg-neutral-50 border border-neutral-200 text-[11px]"
                              >
                                <select
                                  value={costLine.itemId}
                                  onChange={(e) => {
                                    const updatedCostLines = [...choice.costLines!];
                                    const ing = ingredientsMap.get(e.target.value);
                                    updatedCostLines[lIdx] = {
                                      ...costLine,
                                      itemId: e.target.value,
                                      unit: ing?.baseUnit || 'g',
                                    };
                                    handleUpdateChoice(cIdx, { costLines: updatedCostLines });
                                  }}
                                  className="flex-1 rounded border border-neutral-300 bg-white px-2 py-0.5 outline-hidden"
                                >
                                  {store.ingredients.map((ing) => (
                                    <option key={ing.id} value={ing.id}>
                                      {ing.nameTh} ({ing.costPerBaseUnit.toFixed(4)} ฿/{ing.baseUnit})
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min="0.1"
                                  step="any"
                                  value={costLine.quantity}
                                  onChange={(e) => {
                                    const updatedCostLines = [...choice.costLines!];
                                    updatedCostLines[lIdx] = {
                                      ...costLine,
                                      quantity: Number(e.target.value),
                                    };
                                    handleUpdateChoice(cIdx, { costLines: updatedCostLines });
                                  }}
                                  className="w-16 rounded border border-neutral-300 bg-white px-2 py-0.5 tabular-nums font-bold outline-hidden"
                                />
                                <span className="text-neutral-400">{costLine.unit}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCostLineFromChoice(cIdx, lIdx)}
                                  className="p-0.5 text-neutral-400 hover:text-rose-600 ml-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  Save Option Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import { Checkbox, Input } from "@helpdesk-portal/ui-kit";
import ExportIcon from "@helpdesk-portal/icons/Export.svg?react";
import GearIcon from "@helpdesk-portal/icons/GearIcon.svg?react";
import PlusIcon from "@helpdesk-portal/icons/Plus.svg?react";
import SearchIcon from "@helpdesk-portal/icons/Search.svg?react";
import SortAscendingIcon from "@helpdesk-portal/icons/SortAscending.svg?react";
import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router";

import { formatDate } from "@/shared/lib/format-date/format-date";

import type { Project, CreateProjectData } from "@/entities/project";
import { fetchProjects, createProject } from "@/entities/project";
import { ProjectForm } from "@/entities/project/ui/ProjectForm";

import "./ProjectsPage.css";

type SortKey = "name" | "status" | "taskCount" | "createdAt";

interface ColumnConfig {
    id: string;
    label: string;
    always?: boolean;
}

const ALL_COLUMNS: ColumnConfig[] = [
    { id: "name", label: "НАЗВАНИЕ" },
    { id: "description", label: "ОПИСАНИЕ" },
    { id: "status", label: "СТАТУС" },
    { id: "versions", label: "ВЕРСИИ" },
    { id: "tasks", label: "ЗАДАЧИ" },
    { id: "responsible", label: "ОТВЕТСТВЕННЫЙ" },
    { id: "created", label: "СОЗДАН" },
];

export const ProjectsPage: FC = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(ALL_COLUMNS.map(c => c.id)));
    const [creating, setCreating] = useState(false);
    const [columnsOpen, setColumnsOpen] = useState(false);
    const columnsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
                setColumnsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        fetchProjects()
            .then(data => setProjects(data.projects))
            .catch(err => setFetchError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const toggleColumn = (id: string) => {
        setVisibleColumns(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const searched = searchQuery.trim()
        ? projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
        : projects;

    const filtered = sortKey
        ? [...searched].sort((a, b) => {
              const aVal = a[sortKey];
              const bVal = b[sortKey];
              const cmp =
                  typeof aVal === "number" && typeof bVal === "number"
                      ? aVal - bVal
                      : String(aVal).localeCompare(String(bVal));
              return sortDir === "asc" ? cmp : -cmp;
          })
        : searched;

    const allFilteredSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));
    const someFilteredSelected = filtered.some(p => selectedIds.has(p.id));

    const toggleAll = () => {
        if (allFilteredSelected) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                filtered.forEach(p => next.delete(p.id));
                return next;
            });
        } else {
            setSelectedIds(prev => {
                const next = new Set(prev);
                filtered.forEach(p => next.add(p.id));
                return next;
            });
        }
    };

    const handleCreate = async (data: CreateProjectData) => {
        await createProject(data);
        setCreating(false);
        const result = await fetchProjects();
        setProjects(result.projects);
    };

    const activeCount = projects.filter(p => p.status === "ACTIVE").length;
    const totalCount = projects.length;

    return (
        <div className="projects-page">
            <div className="projects-page__title-area">
                <div className="projects-page__title-text">
                    <h1 className="projects-page__title-heading">Проекты</h1>
                    <p className="projects-page__title-subtitle">
                        Все проекты, доступные в Вашей роли — {activeCount} активных из {totalCount}
                    </p>
                </div>
                <div className="projects-page__actions">
                    <button className="projects-page__create-btn" type="button" onClick={() => setCreating(true)}>
                        <PlusIcon />
                        Создать проект
                    </button>
                    <button className="projects-page__export-btn" type="button">
                        <ExportIcon />
                        Экспорт
                    </button>
                    <div className="projects-page__columns-wrapper" ref={columnsRef}>
                        <button
                            className="projects-page__columns-btn"
                            type="button"
                            onClick={() => setColumnsOpen(v => !v)}
                        >
                            <GearIcon />
                            Колонки
                        </button>
                        {columnsOpen && (
                            <div className="projects-page__columns-dropdown">
                                {ALL_COLUMNS.map(col => (
                                    <label key={col.id} className="projects-page__columns-option">
                                        <Checkbox
                                            inputSize="m"
                                            checked={visibleColumns.has(col.id)}
                                            onCheckedChange={() => toggleColumn(col.id)}
                                        />
                                        {col.label}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="projects-page__controls">
                <Input
                    className="projects-page__controls-search"
                    placeholder="Найти проект..."
                    startIcon={<SearchIcon />}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="projects-table-wrapper">
                <table className="projects-table">
                    <thead>
                        <tr>
                            <th className="projects-table__checkbox">
                                <Checkbox
                                    inputSize="m"
                                    checked={allFilteredSelected}
                                    indeterminate={someFilteredSelected && !allFilteredSelected}
                                    onCheckedChange={toggleAll}
                                />
                            </th>
                            {visibleColumns.has("name") && (
                                <SortableTh
                                    className="projects-table__name"
                                    sortKey="name"
                                    currentKey={sortKey}
                                    dir={sortDir}
                                    onClick={handleSort}
                                >
                                    НАЗВАНИЕ
                                </SortableTh>
                            )}
                            {visibleColumns.has("description") && (
                                <th className="projects-table__description">ОПИСАНИЕ</th>
                            )}
                            {visibleColumns.has("status") && (
                                <SortableTh
                                    className="projects-table__status"
                                    sortKey="status"
                                    currentKey={sortKey}
                                    dir={sortDir}
                                    onClick={handleSort}
                                >
                                    СТАТУС
                                </SortableTh>
                            )}
                            {visibleColumns.has("versions") && (
                                <th className="projects-table__versions">ВЕРСИИ</th>
                            )}
                            {visibleColumns.has("tasks") && (
                                <SortableTh
                                    className="projects-table__tasks"
                                    sortKey="taskCount"
                                    currentKey={sortKey}
                                    dir={sortDir}
                                    onClick={handleSort}
                                >
                                    ЗАДАЧИ
                                </SortableTh>
                            )}
                            {visibleColumns.has("responsible") && (
                                <th className="projects-table__responsible">ОТВЕТСТВЕННЫЙ</th>
                            )}
                            {visibleColumns.has("created") && (
                                <SortableTh
                                    className="projects-table__created"
                                    sortKey="createdAt"
                                    currentKey={sortKey}
                                    dir={sortDir}
                                    onClick={handleSort}
                                >
                                    СОЗДАН
                                </SortableTh>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={1 + ALL_COLUMNS.filter(c => visibleColumns.has(c.id)).length} className="projects-table__empty">
                                    Загрузка проектов…
                                </td>
                            </tr>
                        ) : fetchError ? (
                            <tr>
                                <td colSpan={1 + ALL_COLUMNS.filter(c => visibleColumns.has(c.id)).length} className="projects-table__empty">
                                    {fetchError}
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={1 + ALL_COLUMNS.filter(c => visibleColumns.has(c.id)).length} className="projects-table__empty">
                                    {searchQuery.trim() ? "Проекты по вашему запросу не найдены" : "Проекты не найдены"}
                                </td>
                            </tr>
                        ) : (
                            filtered.map(project => (
                                <tr key={project.id}>
                                    <td className="projects-table__checkbox">
                                        <Checkbox
                                            inputSize="m"
                                            checked={selectedIds.has(project.id)}
                                            onCheckedChange={() => toggleSelect(project.id)}
                                        />
                                    </td>
                                    {visibleColumns.has("name") && (
                                        <td className="projects-table__name">
                                            <button className="projects-table__name-link" type="button" onClick={() => navigate(`/projects/${project.id}`)}>
                                                {project.name}
                                            </button>
                                        </td>
                                    )}
                                    {visibleColumns.has("description") && (
                                        <td className="projects-table__description">{project.description}</td>
                                    )}
                                    {visibleColumns.has("status") && (
                                        <td className="projects-table__status">
                                            <StatusBadge status={project.status} />
                                        </td>
                                    )}
                                    {visibleColumns.has("versions") && (
                                        <td className="projects-table__versions">
                                            {project.versions[0] ?? "-"}
                                        </td>
                                    )}
                                    {visibleColumns.has("tasks") && (
                                        <td className="projects-table__tasks">{project.taskCount}</td>
                                    )}
                                    {visibleColumns.has("responsible") && (
                                        <td className="projects-table__responsible">{project.responsible}</td>
                                    )}
                                    {visibleColumns.has("created") && (
                                        <td className="projects-table__created">{formatDate(project.createdAt)}</td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {creating && (
                <div className="projects-page__overlay">
                    <div className="projects-page__modal">
                        <h2 className="projects-page__modal-title">Создание проекта</h2>
                        <ProjectForm
                            onSubmit={handleCreate}
                            onCancel={() => setCreating(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusBadge: FC<{ status: Project["status"] }> = ({ status }) => {
    const isActive = status === "ACTIVE";

    return (
        <span className={`projects-table__status-badge projects-table__status-badge--${isActive ? "active" : "archived"}`}>
            <span className={`projects-table__status-dot projects-table__status-dot--${isActive ? "active" : "archived"}`} />
            {isActive ? "Активный" : "Архивный"}
        </span>
    );
};

interface SortableThProps {
    className: string;
    sortKey: SortKey;
    currentKey: SortKey | null;
    dir: "asc" | "desc";
    onClick: (key: SortKey) => void;
    children: string;
}

const SortableTh: FC<SortableThProps> = ({ className, sortKey, currentKey, dir, onClick, children }) => {
    const isActive = currentKey === sortKey;

    return (
        <th
            className={`${className} projects-table__header--sortable${isActive ? " projects-table__header--sorted" : ""}`}
            onClick={() => onClick(sortKey)}
        >
            {children}
            <span className={`projects-table__sort-icon${isActive ? ` projects-table__sort-icon--${dir}` : ""}`}>
                <SortAscendingIcon />
            </span>
        </th>
    );
};

"use client";

import { Disease } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getYearsAgo } from "@/lib/utils/data-processing";

interface DiseaseListProps {
  diseases: Disease[];
  compact?: boolean;
}

export function DiseaseList({ diseases, compact = false }: DiseaseListProps) {
  if (diseases.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <table className="w-full border-collapse border rounded text-sm">
        <thead>
          <tr>
            <th className="text-left font-semibold px-2 py-2 bg-muted/50 border-b">
              Disease
            </th>
            <th className="text-left font-semibold px-2 py-2 bg-muted/50 border-b">
              Duration
            </th>
          </tr>
        </thead>
        <tbody>
          {diseases.map((disease, index) => (
            <tr key={index}>
              <td className="px-2 py-2.5 border-b last:border-b-0">
                {disease.name}
              </td>
              <td className="px-2 py-2.5 border-b last:border-b-0">
                {getYearsAgo(disease.date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Systemic Conditions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {diseases.map((disease, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50"
            >
              <span className="text-sm font-medium">{disease.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {disease.date}
                </span>
                {getYearsAgo(disease.date) && (
                  <Badge variant="outline" className="text-xs">
                    {getYearsAgo(disease.date)}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
